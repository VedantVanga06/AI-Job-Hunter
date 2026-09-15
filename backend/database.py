from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.orm import declarative_base, sessionmaker


# ==========================================
# DATABASE CONNECTION
# ==========================================

DATABASE_URL = "sqlite:///./job_hunter.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


# ==========================================
# APPLICATION TABLE
# ==========================================

class JobApplication(Base):

    __tablename__ = "job_applications"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    company = Column(
        String(200),
        nullable=False
    )

    job_title = Column(
        String(200),
        nullable=False
    )

    job_url = Column(
        String(500),
        nullable=True
    )

    match_score = Column(
        Integer,
        nullable=True
    )

    status = Column(
        String(50),
        default="Saved"
    )

    notes = Column(
        Text,
        nullable=True
    )


# ==========================================
# CREATE TABLES
# ==========================================

Base.metadata.create_all(
    bind=engine
)


# ==========================================
# DATABASE SESSION
# ==========================================

def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()