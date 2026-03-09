from app import create_app
from app.extensions import db

app = create_app('development')

with app.app_context():
    print("🗑️  Usuwam wszystkie tabele...")
    db.drop_all()
    
    print("✅ Tworzę tabele ponownie...")
    db.create_all()
    
    print("🎉 Baza danych zresetowana!")
    
    # Wypisz wszystkie tabele
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    print("\n📊 Tabele w bazie:")
    for table in inspector.get_table_names():
        print(f"  - {table}")
        
        # Wypisz kolumny
        columns = inspector.get_columns(table)
        for col in columns:
            print(f"    • {col['name']}: {col['type']}")