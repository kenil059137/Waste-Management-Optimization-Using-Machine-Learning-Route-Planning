import osmnx as ox
import networkx as nx
import folium
import math
import pandas as pd
from sklearn.cluster import KMeans

def cluster_bins(full_bins: pd.DataFrame, num_trucks: int) -> pd.DataFrame:
    coords = full_bins[['Latitude', 'Longitude']].values
    kmeans = KMeans(n_clusters=num_trucks, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(coords)
    full_bins = full_bins.copy()
    full_bins['Truck_Assignment'] = clusters
    return full_bins

def split_bins(group: pd.DataFrame, num_trucks: int):
    bins = list(group.index)
    chunk_size = math.ceil(len(bins) / num_trucks)
    return [bins[i:i+chunk_size] for i in range(0, len(bins), chunk_size)]

def optimize_routes_with_osmnx(full_bins: pd.DataFrame, depot_lat: float, depot_lon: float, num_trucks_per_area: int=2, save_maps=False):
    depot = (depot_lat, depot_lon)
    G = ox.graph_from_point(depot, dist=20000, network_type="drive")

    grouped_bins = full_bins.groupby("Area_Type")
    truck_id = 1
    routes_info = []

    for area, group in grouped_bins:
        truck_bins = split_bins(group, num_trucks_per_area)
        for bins_subset in truck_bins:
            locations = [(depot_lat, depot_lon, "Depot")]
            for idx in bins_subset:
                row = group.loc[idx]
                locations.append((row['Latitude'], row['Longitude'], f"Bin_{idx}"))
            locations.append((depot_lat, depot_lon, "Depot_End"))

            nodes = {name: ox.distance.nearest_nodes(G, lon, lat) for lat, lon, name in locations}

            route = []
            for i in range(len(locations) - 1):
                src, dst = locations[i][2], locations[i + 1][2]
                try:
                    path = nx.shortest_path(G, nodes[src], nodes[dst], weight="length")
                    route.extend(path[:-1])
                except nx.NetworkXNoPath:
                    print(f"No path between {src} and {dst}")
            route.append(nodes[locations[-1][2]])

            route_coords = [(G.nodes[node]['y'], G.nodes[node]['x']) for node in route]

            map_file = None
            if save_maps:
                m = folium.Map(location=[depot_lat, depot_lon], zoom_start=13)
                folium.PolyLine(route_coords, color="blue", weight=4.5, opacity=0.8).add_to(m)
                for lat, lon, name in locations:
                    color = "green" if "Depot" in name else "orange"
                    folium.Marker([lat, lon], popup=name, icon=folium.Icon(color=color)).add_to(m)
                map_file = f"optimized_route_area{area}_truck{truck_id}.html"
                m.save(map_file)

            routes_info.append({
                "truck_id": truck_id,
                "area": area,
                "num_bins": len(bins_subset),
                "route_nodes": route,
                "route_coords": route_coords,
                "map_file": map_file
            })

            truck_id += 1

    return routes_info
