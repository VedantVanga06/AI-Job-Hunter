import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
from main import app


@pytest.fixture()
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


def test_health_reports_database(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert response.json()["database"] == "connected"


def test_application_create_list_update_delete(client):
    created = client.post(
        "/api/applications",
        json={
            "company": "Example Labs",
            "job_title": "AI Intern",
            "job_url": "https://example.com/jobs/1",
            "match_score": 82,
            "status": "Wishlist",
            "notes": "Apply before Friday",
        },
    )
    assert created.status_code == 200
    application_id = created.json()["id"]
    assert created.json()["company"] == "Example Labs"

    listed = client.get("/api/applications")
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    updated = client.put(
        f"/api/applications/{application_id}",
        json={"status": "Interview", "notes": "Prepare project walkthrough"},
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "Interview"
    assert updated.json()["notes"] == "Prepare project walkthrough"
    assert updated.json()["job_url"] == "https://example.com/jobs/1"

    deleted = client.delete(f"/api/applications/{application_id}")
    assert deleted.status_code == 200
    assert client.get("/api/applications").json() == []


def test_application_rejects_unknown_status(client):
    response = client.post(
        "/api/applications",
        json={"company": "Example", "job_title": "Intern", "status": "Magically Hired"},
    )
    assert response.status_code == 422


def test_application_rejects_invalid_match_score(client):
    response = client.post(
        "/api/applications",
        json={"company": "Example", "job_title": "Intern", "match_score": 120},
    )
    assert response.status_code == 422
