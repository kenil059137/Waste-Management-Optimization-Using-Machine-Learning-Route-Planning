from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
import os
from typing import Optional
from optimization import cluster_bins, optimize_routes_with_osmnx

# Load models and data
predictor = joblib.load("best_model.pkl") if os.path.exists("best_model.pkl") else None
kmeans = joblib.load("kmeans_model.pkl") if os.path.exists("kmeans_model.pkl") else None
DATA_PATH = r"D:\project-II\full_bins.csv"

full_bins = pd.read_csv(DATA_PATH) if os.path.exists(DATA_PATH) else pd.DataFrame()
if "Truck_Assignment" not in full_bins.columns:
    full_bins["Truck_Assignment"] = None

DIST_MTX = {}
for area in ["Residential", "Commercial", "Industrial"]:
    fname = fr"D:\project-II\distance_matrix_fullbins_{area}.csv"
    if os.path.exists(fname):
        DIST_MTX[area] = pd.read_csv(fname, index_col=0)

app = FastAPI(title="Smart Waste Routing API")

# Enable CORS for local development frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend origin(s)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictRequest(BaseModel):
    Area_Type: str
    Time_Since_Last_Collection: float
    Weather: str

class OptimizeRequest(BaseModel):
    num_trucks: int
    alpha: float = 0.5
    beta: float = 0.5
    area: str = None
    fill_threshold: float = None


class BinUpdateRequest(BaseModel):
    Bin_ID: int
    Fill_Level: Optional[float] = None
    Time_Since_Last_Collection: Optional[float] = None
    Weather: Optional[str] = None

class ClusterRequest(BaseModel):
    num_trucks: int

class RouteRequest(BaseModel):
    depot_lat: float
    depot_lon: float
    num_trucks_per_area: Optional[int] = 2
    save_maps: Optional[bool] = False

cached_routes = {}

class IncrementalOptimizeRequest(BaseModel):
    changed_bin_ids: list[int]

def optimize_route_for_bins(bins_subset: pd.DataFrame):
    depot_lat = 21.1702  # Replace with dynamic depot if you want
    depot_lon = 72.8311
    num_trucks = 1  # Because this optimization is per truck set of bins
    
    routes_info = optimize_routes_with_osmnx(
        bins_subset,
        depot_lat,
        depot_lon,
        num_trucks_per_area=num_trucks,
        save_maps=False
    )
    if routes_info and len(routes_info):
        return routes_info[0]
    else:
        return None




@app.get("/")
def root():
    return {
        "message": "Smart Waste Routing API. See /docs.",
        "model_loaded": predictor is not None,
        "clustering_loaded": kmeans is not None,
        "data_rows": len(full_bins),
    }

import traceback

import traceback

@app.post("/incremental_optimize_routes")
def incremental_optimize_routes(request: IncrementalOptimizeRequest):
    try:
        if full_bins.empty:
            raise HTTPException(status_code=404, detail="Bin data not loaded")

        changed_bin_ids = request.changed_bin_ids
        affected_trucks = full_bins.loc[
            full_bins['Bin_ID'].isin(changed_bin_ids),
            'Truck_Assignment'
        ].unique()

        for truck_id in affected_trucks:
            bins_for_truck = full_bins.loc[full_bins['Truck_Assignment'] == truck_id]
            updated_route = optimize_route_for_bins(bins_for_truck)
            cached_routes[truck_id] = updated_route

        return cached_routes
    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/data_preview")
def data_preview(n: int = 20):
    if full_bins.empty:
        raise HTTPException(status_code=404, detail="No bin data loaded.")
    return full_bins.head(n).to_dict(orient="records")

from fastapi import HTTPException
import logging


from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)






@app.post("/update_bin")
def update_bin(request: BinUpdateRequest):
    try:
        if full_bins.empty:
            raise HTTPException(status_code=404, detail="No bin data loaded.")
        
        idxs = full_bins[full_bins["Bin_ID"] == request.Bin_ID].index
        if len(idxs) == 0:
            raise HTTPException(status_code=404, detail="Bin_ID not found.")
        
        request_dict = request.dict(exclude_unset=True)
        for field, value in request_dict.items():
            if field == "Bin_ID":
                continue
            
            colname = field_to_column.get(field)
            if colname is None:
                raise HTTPException(status_code=400, detail=f"Field '{field}' is unknown or not allowed.")
            if colname not in full_bins.columns:
                raise HTTPException(status_code=400, detail=f"Column '{colname}' does not exist.")
            
            full_bins.loc[idxs, colname] = value
        
        # full_bins.to_csv(DATA_PATH, index=False)
        
        return {
            "status": "success",
            "updated_bin": request.Bin_ID,
            "updated_fields": [field for field in request_dict.keys() if field != "Bin_ID"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Update bin error: {e}")







import pandas as pd

@app.post("/predict_bin")
def predict_bin(request: PredictRequest):
    if predictor is None:
        raise HTTPException(status_code=501, detail="Prediction model not loaded.")
    try:
        df = pd.DataFrame([{
            'Area_Type': request.Area_Type,
            'Time_Since_Last_Collection(hrs)': request.Time_Since_Last_Collection,
            'Weather': request.Weather
        }])
        pred = predictor.predict(df)[0]
        return {"is_full": bool(pred)}
    except Exception as e:
        logging.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {e}")




# Mapping from JSON fields (API friendly) to exact CSV columns
field_to_column = {
    "Fill_Level": "Fill_Level(%)",
    "Time_Since_Last_Collection": "Time_Since_Last_Collection(hrs)",
    "Weather": "Weather",
    # add mappings for other columns you want to allow updates on
}

@app.post("/update_bin")
def update_bin(request: BinUpdateRequest):
    try:
        if full_bins.empty:
            raise HTTPException(status_code=404, detail="No bin data loaded.")
        idxs = full_bins[full_bins['Bin_ID'] == request.Bin_ID].index
        if len(idxs) == 0:
            raise HTTPException(status_code=404, detail="Bin_ID not found.")
        request_dict = request.dict(exclude_unset=True)
        for field, value in request_dict.items():
            if field == "Bin_ID":
                continue
            colname = field_to_column.get(field)
            if colname is None:
                raise HTTPException(status_code=400, detail=f"Unknown field: {field}")
            if colname not in full_bins.columns:
                raise HTTPException(status_code=400, detail=f"Column '{colname}' does not exist.")
            full_bins.loc[idxs, colname] = value
        full_bins.to_csv(DATA_PATH, index=False)
        return {"status": "success", "updated_bin": request.Bin_ID, "updated_fields": list(request_dict.keys())[1:]}
    except Exception as e:
        logging.error(f"Update bin error: {e}")
        raise HTTPException(status_code=500, detail=f"Update bin error: {e}")





@app.get("/model_info")
def model_info():
    return {
        "classification_model": str(type(predictor)) if predictor else None,
        "clustering_model": str(type(kmeans)) if kmeans else None,
        "data_columns": list(full_bins.columns),
        "data_rows": len(full_bins)
    }

@app.post("/cluster_bins")
def cluster_bins_api(request: ClusterRequest):
    try:
        if full_bins.empty:
            raise HTTPException(status_code=404, detail="Bin data is empty")

        # Aggregate to unique bins by latest Hour per Bin_ID
        latest_bins = full_bins.sort_values('Hour', ascending=False).drop_duplicates(subset='Bin_ID', keep='first')

        # Run clustering on aggregated bins
        clustered = cluster_bins(latest_bins, request.num_trucks)

        # Check clustered output columns
        if 'Bin_ID' not in clustered.columns or 'Truck_Assignment' not in clustered.columns:
            raise HTTPException(status_code=500, detail="Clustering result must contain Bin_ID and Truck_Assignment columns")

        # Map Truck_Assignment to full dataset including all duplicate records
        cluster_map = clustered.set_index('Bin_ID')['Truck_Assignment'].to_dict()
        full_bins['Truck_Assignment'] = full_bins['Bin_ID'].map(cluster_map)

        # Save to CSV to persist changes (handle permission errors if needed)
        try:
            full_bins.to_csv(DATA_PATH, index=False)
        except PermissionError as e:
            print(f"Warning: Could not save full_bins.csv due to permission error: {e}")

        return clustered.to_dict(orient="records")
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Cluster bins error: {e}")





# Add route optimization endpoint
@app.post("/optimize_routes")
def optimize_routes_api(request: RouteRequest):
    routes = optimize_routes_with_osmnx(full_bins,
                                       request.depot_lat,
                                       request.depot_lon,
                                       request.num_trucks_per_area,
                                       request.save_maps)
    return routes


@app.get("/clusters")
def get_clusters():
    try:
        cols = ['Bin_ID', 'Latitude', 'Longitude', 'Truck_Assignment', 'Fill_Level(%)', 'Area_Type']
        if full_bins.empty:
            raise ValueError("Bin data is empty or not loaded.")
        for col in cols:
            if col not in full_bins.columns:
                raise ValueError(f"Missing column: {col}")
        return full_bins[cols].to_dict(orient="records")
    except Exception as e:
        import traceback
        print("Error in /clusters:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"/clusters error: {e}")



@app.get("/bin_fill_levels")
def get_fill_levels():
    # Return current fill levels of all bins
    return full_bins[['Bin_ID', 'Fill_Level(%)']].to_dict(orient="records")


@app.get("/optimization_summary")
def get_summary():
    # Return key stats for frontend display
    total_trucks = full_bins['Truck_Assignment'].nunique() if 'Truck_Assignment' in full_bins.columns else 0
    return {
        "total_bins": len(full_bins),
        "total_trucks": total_trucks,
        # Add more computed stats as needed
    }


@app.get("/routes")
def get_routes():
    # Use your existing optimize_routes_with_osmnx function to get routes info without saving maps
    depot_lat, depot_lon = 21.1702, 72.8311  # replace with your actual depot or make dynamic
    routes_info = optimize_routes_with_osmnx(full_bins, depot_lat, depot_lon, num_trucks_per_area=2, save_maps=False)

    result = []
    for route in routes_info:
        bin_ids_in_route = []
        # Extract Bin IDs from route coordinates information (or from your function logic)
        # Assuming your function can return bin IDs or you modify it to do so
        # For now, create dummy bin_id list placeholder
        bin_ids_in_route = []  # Customize extraction as per actual data structure

        result.append({
            "truck_id": route["truck_id"],
            "area": route["area"],
            "num_bins": route["num_bins"],
            "route_coords": route["route_coords"],
            "bin_sequence": bin_ids_in_route,
        })
    return result
