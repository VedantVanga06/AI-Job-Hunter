import os
from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.engine import make_url

# Prefer a managed database in hosted environments. SQLite remains the
# zero-configuration local development default.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./job_hunter.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len("postgres://"):]
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len("postgresql://"):]

_connect_args = {"check_same_thread": False} if make_url(DATABASE_URL).get_backend_name() == "sqlite" else {}
engine = create_engine(DATABASE_URL, connect_args=_connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class JobApplication(Base):
    __tablename__ = "job_applications"
    id = Column(Integer, primary_key=True, index=True)
    company = Column(String(200), nullable=False)
    job_title = Column(String(200), nullable=False)
    job_url = Column(String(500), nullable=True)
    match_score = Column(Integer, nullable=True)
    status = Column(String(50), default="Saved", nullable=False)
    notes = Column(Text, nullable=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
