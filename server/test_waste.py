import pytest
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)


# ✅ 1. UNIT TEST — Model Info
def test_model_info():
    response = client.get("/model_info")
    assert response.status_code == 200


# ✅ 2. UNIT TEST — Predict Bin valid input
def test_predict_bin_valid_input():
    payload = {
        "Area_Type": "Residential",
        "Time_Since_Last_Collection": 24,
        "Weather": "Sunny"
    }
    response = client.post("/predict_bin", json=payload)
    assert response.status_code == 200
    assert "is_full" in response.json()
    assert isinstance(response.json()["is_full"], bool)


# ✅ 3. NEGATIVE TEST — Missing required fields should return 422
def test_predict_bin_invalid_input():
    payload = {"Area_Type": "Residential"}  # missing fields
    response = client.post("/predict_bin", json=payload)
    assert response.status_code == 422


# ✅ 4. UNIT TEST — Data Preview
def test_data_preview():
    response = client.get("/data_preview")
    assert response.status_code == 200


# ✅ 5. UNIT TEST — Bin Fill Levels
def test_bin_fill_levels():
    response = client.get("/bin_fill_levels")
    assert response.status_code == 200


# ✅ 6. INTEGRATION TEST — Clusters then Routes
def test_get_clusters():
    response = client.get("/clusters")
    assert response.status_code == 200

def test_get_routes():
    response = client.get("/routes")
    assert response.status_code == 200