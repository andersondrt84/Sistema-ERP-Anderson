import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class PrinterType(str, enum.Enum):
    LASER = "laser"
    INKJET = "jato_de_tinta"


class PrinterBrand(str, enum.Enum):
    HP = "HP"
    EPSON = "Epson"


class ServiceOrderStatus(str, enum.Enum):
    OPEN = "aberta"
    IN_PROGRESS = "em_andamento"
    DONE = "concluida"
    CANCELED = "cancelada"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Person(Base):
    __tablename__ = "people"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    phone = Column(String(30), nullable=True)
    email = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    phone = Column(String(30), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    service_orders = relationship("ServiceOrder", back_populates="client")


class ServiceOrder(Base):
    __tablename__ = "service_orders"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    description = Column(Text, nullable=False)
    amount_charged = Column(Numeric(10, 2), nullable=False)
    printer_type = Column(Enum(PrinterType), nullable=False)
    printer_brand = Column(Enum(PrinterBrand), nullable=False)
    status = Column(Enum(ServiceOrderStatus), nullable=False, default=ServiceOrderStatus.OPEN)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    client = relationship("Client", back_populates="service_orders")
