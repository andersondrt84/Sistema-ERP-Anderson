from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, EmailStr, Field
from app.models import PrinterType, PrinterBrand, ServiceOrderStatus


class Token(BaseModel):
    access_token: str
    token_type: str


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        from_attributes = True


class PersonCreate(BaseModel):
    full_name: str
    phone: str | None = None
    email: EmailStr | None = None
    notes: str | None = None


class PersonOut(PersonCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ClientCreate(BaseModel):
    name: str
    phone: str | None = None
    email: EmailStr | None = None
    address: str | None = None


class ClientOut(ClientCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ServiceOrderCreate(BaseModel):
    client_id: int
    description: str
    amount_charged: Decimal = Field(gt=0)
    printer_type: PrinterType
    printer_brand: PrinterBrand
    status: ServiceOrderStatus = ServiceOrderStatus.OPEN


class ServiceOrderOut(ServiceOrderCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
