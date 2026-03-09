from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from backend.db import db
from backend.models import User
import jwt
import os

user = Blueprint('user', __name__)

SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')

def format_user(user):
    return {
        'id': user.id,
        'email': user.email,
        'first_name': user.first_name,
        'created_at': user.created_at.strftime('%d-%m-%Y')
    }

# Rejestracja użytkownika
@user.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        first_name = data.get('first_name')

        if not all([email, password, first_name]):
            return jsonify({"error": "Wszystkie pola są wymagane"}), 400

        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"error": "Użytkownik o tym adresie email już istnieje"}), 409

        new_user = User(
            email=email,
            password=password,
            first_name=first_name,
        )

        db.session.add(new_user)
        db.session.commit()

        token = jwt.encode(
            {
                'user_id': new_user.id,
                'exp': datetime.utcnow() + timedelta(days=7)
            },
            SECRET_KEY,
            algorithm='HS256'
        )

        return jsonify({
            "message": "Użytkownik został zarejestrowany",
            "token": token,
            "user": format_user(new_user)
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Błąd podczas rejestracji: {str(e)}"}), 500


# Logowanie użytkownika
@user.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not all([email, password]):
            return jsonify({"error": "Email i hasło są wymagane"}), 400

        user = User.query.filter_by(email=email).first()

        if not user or not user.check_password(password):
            return jsonify({"error": "Nieprawidłowy email lub hasło"}), 401

        token = jwt.encode(
            {
                'user_id': user.id,
                'exp': datetime.utcnow() + timedelta(days=7)
            },
            SECRET_KEY,
            algorithm='HS256'
        )

        return jsonify({
            "message": "Zalogowano pomyślnie",
            "token": token,
            "user": format_user(user)
        }), 200

    except Exception as e:
        return jsonify({"error": f"Błąd podczas logowania: {str(e)}"}), 500


# Weryfikacja tokenu i pobranie danych użytkownika
@user.route('/me', methods=['GET'])
def get_current_user():
    try:
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Brak tokenu autoryzacji"}), 401

        token = auth_header.split(' ')[1]

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            user_id = payload['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token wygasł"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Nieprawidłowy token"}), 401

        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "Użytkownik nie znaleziony"}), 404

        return jsonify({"user": format_user(user)}), 200

    except Exception as e:
        return jsonify({"error": f"Błąd podczas weryfikacji: {str(e)}"}), 500


# Wylogowanie (po stronie frontendu usuwa token)
@user.route('/logout', methods=['POST'])
def logout():
    return jsonify({"message": "Wylogowano pomyślnie"}), 200