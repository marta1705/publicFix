from flask import Blueprint, request, jsonify
from backend.db import db
from backend.models import Report

admin = Blueprint('admin', __name__)

def format_report(report):
    return {
        'id': report.id,
        'description': report.description,
        'date': report.date.strftime('%d-%m-%Y'),
        'image_url': report.image_url,
        'status': report.status,
        'latitude': report.latitude,
        'longitude': report.longitude,
        'category': report.category,
        'user_id': report.user_id,
        'source': report.source
    }

@admin.route('/admin/pending-reports', methods=['GET'])
def get_pending_reports():
    try:
        reports = Report.query.filter_by(status='Oczekujące').order_by(Report.date.desc()).all()
        report_list = [format_report(report) for report in reports]
        return jsonify({"reports": report_list}), 200
    except Exception as e:
        return jsonify({"error": f"Błąd pobierania zgłoszeń: {str(e)}"}), 500

@admin.route('/admin/approve-report/<int:report_id>', methods=['POST'])
def approve_report(report_id):
    try:
        report = Report.query.get(report_id)
        if not report:
            return jsonify({"error": "Zgłoszenie nie znalezione"}), 404
        
        report.status = 'Zarejestrowane'
        db.session.commit()
        
        return jsonify({
            "message": "Zgłoszenie zatwierdzone",
            "report": format_report(report)
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Błąd zatwierdzania: {str(e)}"}), 500

@admin.route('/admin/reject-report/<int:report_id>', methods=['POST'])
def reject_report(report_id):
    try:
        report = Report.query.get(report_id)
        if not report:
            return jsonify({"error": "Zgłoszenie nie znalezione"}), 404
        
        db.session.delete(report)
        db.session.commit()
        
        return jsonify({"message": "Zgłoszenie odrzucone"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Błąd odrzucania: {str(e)}"}), 500

@admin.route('/admin/approve-all', methods=['POST'])
def approve_all_reports():
    try:
        reports = Report.query.filter_by(status='Oczekujące').all()
        count = len(reports)
        
        for report in reports:
            report.status = 'Zarejestrowane'
        
        db.session.commit()
        
        return jsonify({
            "message": f"Zatwierdzono {count} zgłoszeń",
            "count": count
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Błąd masowego zatwierdzania: {str(e)}"}), 500

@admin.route('/admin/sync-twitter', methods=['POST'])
def manual_sync_twitter():
    try:
        from backend.services.twitter_sync import TwitterSyncService
        
        data = request.get_json() or {}
        custom_queries = data.get('queries')
        
        service = TwitterSyncService()
        result = service.sync_reports(custom_queries=custom_queries)
        
        return jsonify({
            "message": "Synchronizacja zakończona",
            "result": result
        }), 200
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Błąd synchronizacji: {error_details}")
        return jsonify({"error": f"Błąd synchronizacji: {str(e)}"}), 500