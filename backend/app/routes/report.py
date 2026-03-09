from datetime import datetime
import os
from flask import Blueprint, request, jsonify
from ..extensions import db
from ..models.report import Report
from werkzeug.utils import secure_filename
from flask import current_app as app
from flask_jwt_extended import jwt_required, get_jwt_identity

report = Blueprint('report', __name__, url_prefix='/api')

def format_report(report):
    """Format report to dictionary"""
    return {
        'id': report.id,
        'description': report.description,
        'date': report.date.strftime('%d-%m-%Y'),
        'image_url': report.image_url,
        'status': report.status,
        'latitude': report.latitude,
        'longitude': report.longitude,
        'category': report.category,
        'source': report.source,  # ✅ Dodane
        'user_id': report.user_id
    }


# ✅ Create a new report (tylko dla zalogowanych użytkowników - source='web')
@report.route('/report', methods=['POST'])
@jwt_required()
def create_report():
    try:
        # Pobierz ID zalogowanego użytkownika
        current_user_id = get_jwt_identity()
        
        # Pobierz dane z formularza
        data = request.form
        description = data.get('description')
        date_str = data.get('date')
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        category = data.get('category')
        
        # Walidacja wymaganych pól
        if not all([description, date_str, latitude, longitude, category]):
            return jsonify({'error': 'Brakujące wymagane pola'}), 400
        
        # Obsługa obrazka
        image = request.files.get('image')
        image_url = None
        if image:
            filename = secure_filename(image.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            image.save(filepath)
            image_url = f'/static/uploads/{filename}'
        
        # Parsuj datę
        try:
            parsed_date = datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Nieprawidłowy format daty (wymagany: YYYY-MM-DD)'}), 400
        
        # ✅ Utwórz zgłoszenie z source='web' i user_id
        new_report = Report(
            description=description,
            date=parsed_date,
            image_url=image_url,
            latitude=float(latitude),
            longitude=float(longitude),
            category=category,
            source='manual',  # ✅ Zgłoszenie z formularza
            user_id=int(current_user_id)
        )
        
        db.session.add(new_report)
        db.session.commit()
        
        return jsonify({
            'message': 'Zgłoszenie utworzone pomyślnie',
            'report': format_report(new_report)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating report: {str(e)}")
        return jsonify({'error': f'Błąd podczas tworzenia zgłoszenia: {str(e)}'}), 500


# ✅ Get all reports (publiczne - bez JWT)
@report.route('/report', methods=['GET'])
def get_reports():
    try:
        # Opcjonalny filtr po source
        source_filter = request.args.get('source')  # ?source=web lub ?source=twitter
        
        query = Report.query
        
        if source_filter:
            query = query.filter_by(source=source_filter)
        
        reports = query.order_by(Report.date.desc()).all()
        report_list = [format_report(r) for r in reports]
        
        return jsonify({
            'reports': report_list,
            'count': len(report_list)
        }), 200
        
    except Exception as e:
        print(f"Error fetching reports: {str(e)}")
        return jsonify({'error': f'Błąd podczas pobierania zgłoszeń: {str(e)}'}), 500


# ✅ Get a report by ID (publiczne)
@report.route('/report/<int:report_id>', methods=['GET'])
def get_report(report_id):
    try:
        report_obj = Report.query.get(report_id)
        
        if not report_obj:
            return jsonify({'error': 'Zgłoszenie nie znalezione'}), 404
        
        return jsonify({'report': format_report(report_obj)}), 200
        
    except Exception as e:
        print(f"Error fetching report: {str(e)}")
        return jsonify({'error': f'Błąd podczas pobierania zgłoszenia: {str(e)}'}), 500


# ✅ Update a report by ID (tylko właściciel dla source='web', admin dla 'twitter')
@report.route('/report/<int:report_id>', methods=['PUT'])
@jwt_required()
def update_report(report_id):
    try:
        current_user_id = get_jwt_identity()
        report_obj = Report.query.get(report_id)
        
        if not report_obj:
            return jsonify({'error': 'Zgłoszenie nie znalezione'}), 404
        
        # ✅ Sprawdź uprawnienia:
        # - Zgłoszenia 'manual': tylko właściciel może edytować
        # - Zgłoszenia 'twitter': tylko admin może edytować (TODO: dodaj sprawdzanie roli admina)
        if report_obj.source == 'manual':
            if report_obj.user_id != int(current_user_id):
                return jsonify({'error': 'Brak uprawnień do edycji tego zgłoszenia'}), 403
        # TODO: Dla 'twitter' - sprawdź czy user jest adminem
        
        # Aktualizacja pól
        data = request.form
        
        if 'description' in data:
            report_obj.description = data['description']
        if 'latitude' in data:
            report_obj.latitude = float(data['latitude'])
        if 'longitude' in data:
            report_obj.longitude = float(data['longitude'])
        if 'category' in data:
            report_obj.category = data['category']
        if 'status' in data:
            report_obj.status = data['status']
        
        # Aktualizacja daty
        if 'date' in data:
            try:
                report_obj.date = datetime.strptime(data['date'], "%Y-%m-%d")
            except ValueError:
                return jsonify({'error': 'Nieprawidłowy format daty'}), 400
        
        # Obsługa nowego obrazka
        image = request.files.get('image')
        if image:
            # Usuń stary obrazek
            if report_obj.image_url:
                old_image_path = os.path.join(
                    app.config['UPLOAD_FOLDER'],
                    os.path.basename(report_obj.image_url)
                )
                if os.path.exists(old_image_path):
                    os.remove(old_image_path)
            
            # Zapisz nowy obrazek
            filename = secure_filename(image.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            image.save(filepath)
            report_obj.image_url = f'/static/uploads/{filename}'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Zgłoszenie zaktualizowane',
            'report': format_report(report_obj)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating report: {str(e)}")
        return jsonify({'error': f'Błąd podczas aktualizacji zgłoszenia: {str(e)}'}), 500


# ✅ Delete a report by ID (tylko właściciel dla 'web', admin dla 'twitter')
@report.route('/report/<int:report_id>', methods=['DELETE'])
@jwt_required()
def delete_report(report_id):
    try:
        current_user_id = get_jwt_identity()
        report_obj = Report.query.get(report_id)
        
        if not report_obj:
            return jsonify({'error': 'Zgłoszenie nie znalezione'}), 404
        
        # ✅ Sprawdź uprawnienia
        if report_obj.source == 'manual':
            if report_obj.user_id != int(current_user_id):
                return jsonify({'error': 'Brak uprawnień do usunięcia tego zgłoszenia'}), 403
        # TODO: Dla 'twitter' - sprawdź czy user jest adminem
        
        # Usuń plik obrazka
        if report_obj.image_url:
            old_image_path = os.path.join(
                app.config['UPLOAD_FOLDER'],
                os.path.basename(report_obj.image_url)
            )
            if os.path.exists(old_image_path):
                os.remove(old_image_path)
        
        db.session.delete(report_obj)
        db.session.commit()
        
        return jsonify({'message': 'Zgłoszenie usunięte pomyślnie'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting report: {str(e)}")
        return jsonify({'error': f'Błąd podczas usuwania zgłoszenia: {str(e)}'}), 500


# ✅ Get my reports (zgłoszenia zalogowanego użytkownika - tylko source='web')
@report.route('/report/my', methods=['GET'])
@jwt_required()
def get_my_reports():
    try:
        current_user_id = get_jwt_identity()
        
        # Pobierz tylko zgłoszenia zalogowanego użytkownika z source='web'
        reports = Report.query.filter_by(
            user_id=int(current_user_id),
            source='manual'
        ).order_by(Report.date.desc()).all()
        
        report_list = [format_report(r) for r in reports]
        
        return jsonify({
            'reports': report_list,
            'count': len(report_list)
        }), 200
        
    except Exception as e:
        print(f"Error fetching my reports: {str(e)}")
        return jsonify({'error': f'Błąd podczas pobierania zgłoszeń: {str(e)}'}), 500


# ✅ NOWY: Endpoint dla Twitter sync (bez JWT!)
@report.route('/report/twitter', methods=['POST'])
def create_twitter_report():
    """
    Endpoint dla skryptu synchronizacji z Twitterem.
    Tworzy zgłoszenie z source='twitter' i user_id=None.
    
    TODO: Dodaj autoryzację API key dla bezpieczeństwa!
    """
    try:
        # TODO: Sprawdź API key w headerze (dla bezpieczeństwa)
        # api_key = request.headers.get('X-API-Key')
        # if api_key != app.config.get('TWITTER_SYNC_API_KEY'):
        #     return jsonify({'error': 'Unauthorized'}), 401
        
        data = request.get_json()
        
        # Walidacja wymaganych pól
        required = ['description', 'date', 'latitude', 'longitude', 'category']
        if not all(field in data for field in required):
            return jsonify({'error': 'Brakujące wymagane pola'}), 400
        
        # Parsuj datę
        try:
            if isinstance(data['date'], str):
                parsed_date = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
            else:
                parsed_date = data['date']
        except (ValueError, AttributeError):
            return jsonify({'error': 'Nieprawidłowy format daty'}), 400
        
        # ✅ Utwórz zgłoszenie z source='twitter' i user_id=None
        new_report = Report(
            description=data['description'],
            date=parsed_date,
            image_url=data.get('image_url'),
            latitude=float(data['latitude']),
            longitude=float(data['longitude']),
            category=data['category'],
            source='twitter',  # ✅ Zgłoszenie z Twittera
            user_id=None       # ✅ Brak użytkownika
        )
        
        db.session.add(new_report)
        db.session.commit()
        
        return jsonify({
            'message': 'Zgłoszenie z Twittera utworzone',
            'report': format_report(new_report)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating Twitter report: {str(e)}")
        return jsonify({'error': f'Błąd podczas tworzenia zgłoszenia: {str(e)}'}), 500