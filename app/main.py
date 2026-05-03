from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db, settings
from app.models import User, Client, Person, ServiceOrder
from app.schemas import (
    Token,
    UserCreate,
    UserOut,
    ClientCreate,
    ClientOut,
    PersonCreate,
    PersonOut,
    ServiceOrderCreate,
    ServiceOrderOut,
)
from app.security import create_access_token, get_password_hash, verify_password

app = FastAPI(title="Gestão TI - Assistência Técnica", version="1.0.0")
Base.metadata.create_all(bind=engine)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

MASTER_USERNAME = "admin"
MASTER_PASSWORD = "12345678"
MASTER_EMAIL = "admin@local"


def ensure_master_user(db: Session) -> None:
    existing = db.query(User).filter(User.name == MASTER_USERNAME).first()
    if existing:
        return

    user = User(
        name=MASTER_USERNAME,
        email=MASTER_EMAIL,
        hashed_password=get_password_hash(MASTER_PASSWORD),
    )
    db.add(user)
    db.commit()


with Session(engine) as db:
    ensure_master_user(db)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        email: str | None = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise credentials_exception
    return user


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/auth/register", response_model=UserOut)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing_name = db.query(User).filter(User.name == user_in.name).first()
    if existing_name:
        raise HTTPException(status_code=400, detail="Usuário já cadastrado")

    existing_email = db.query(User).filter(User.email == user_in.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    user = User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.name == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Credenciais inválidas")

    token = create_access_token(user.email)
    return {"access_token": token, "token_type": "bearer"}


@app.post("/people", response_model=PersonOut)
def create_person(
    payload: PersonCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    person = Person(**payload.model_dump())
    db.add(person)
    db.commit()
    db.refresh(person)
    return person


@app.get("/people", response_model=list[PersonOut])
def list_people(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Person).order_by(Person.created_at.desc()).all()


@app.post("/clients", response_model=ClientOut)
def create_client(
    payload: ClientCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    client = Client(**payload.model_dump())
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


@app.get("/clients", response_model=list[ClientOut])
def list_clients(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Client).order_by(Client.created_at.desc()).all()


@app.post("/service-orders", response_model=ServiceOrderOut)
def create_service_order(
    payload: ServiceOrderCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    client = db.query(Client).filter(Client.id == payload.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    service_order = ServiceOrder(**payload.model_dump())
    db.add(service_order)
    db.commit()
    db.refresh(service_order)
    return service_order


@app.get("/service-orders", response_model=list[ServiceOrderOut])
def list_service_orders(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(ServiceOrder).order_by(ServiceOrder.created_at.desc()).all()
