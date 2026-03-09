from ..extensions import db
from datetime import datetime

class Report(db.Model):
    __tablename__ = 'reports'
    
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(200), nullable=False)
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    image_url = db.Column(db.String(200), nullable=True)
    status = db.Column(db.String(50), nullable=False, default='Zarejestrowane')
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100), nullable=False)
    source = db.Column(db.String(50), nullable=True, default='manual')
    
    # ✅ POPRAWKA: Tylko JEDEN user_id, poprawna nazwa tabeli
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Opcjonalne pola do śledzenia
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Report {self.id}: {self.category}>'

    def __init__(self, description, date, latitude, longitude, category, source='manual', user_id=None, image_url=None):
        self.description = description
        self.date = date
        self.image_url = image_url
        self.latitude = latitude
        self.longitude = longitude
        self.category = category
        self.source = source
        self.user_id = user_id
    
    def to_dict(self):
        """Konwertuje report do słownika"""
        return {
            'id': self.id,
            'description': self.description,
            'date': self.date.strftime('%d-%m-%Y'),
            'image_url': self.image_url,
            'status': self.status,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'category': self.category,
            'source': self.source,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }