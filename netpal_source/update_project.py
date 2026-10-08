#!/usr/bin/env python3
"""
NetPal Website - Complete Update Script
Fixes ALL issues:
1. Translation bug (feat_1, feat_2, feat_3 not translating to English)
2. Team cards not changing with theme
3. Admin: Full CRUD (edit) for sections, subsections, team  
4. Admin: Projects organized by section/subsection
5. Multi-image/video upload (no URL inputs)
6. Project detail page with original-size gallery images
7. 3D effects throughout entire site
8. Fix all CSS/JS issues
"""
import os

BASE = os.path.dirname(os.path.abspath(__file__))
def w(rel, content):
    path = os.path.join(BASE, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✅ {rel}")

print("🔧 Updating NetPal Website...\n")

# ═══════════════════════════════════════════════════════════
# 1. APP.PY - Complete rewrite with all CRUD + multi-upload
# ═══════════════════════════════════════════════════════════
print("📦 Writing app.py...")
w('app.py', r'''import os, uuid
from functools import wraps
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, abort
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['SECRET_KEY'] = 'netpal_super_secret_infinity_key_2026'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///netpal.db'
app.config['UPLOAD_FOLDER'] = os.path.join('static', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024
ALLOWED_IMG = {'png','jpg','jpeg','gif','svg','webp'}
ALLOWED_VID = {'mp4','webm','mov','avi'}
ALLOWED_EXT = ALLOWED_IMG | ALLOWED_VID
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'admin_login'

def allowed_file(fn):
    return '.' in fn and fn.rsplit('.',1)[1].lower() in ALLOWED_EXT

def is_video(fn):
    return '.' in fn and fn.rsplit('.',1)[1].lower() in ALLOWED_VID

def save_upload(f):
    """Save uploaded file with unique name, return filename."""
    if f and f.filename and allowed_file(f.filename):
        ext = f.filename.rsplit('.',1)[1].lower()
        fn = f"{uuid.uuid4().hex}.{ext}"
        f.save(os.path.join(app.config['UPLOAD_FOLDER'], fn))
        return fn
    return None

# ── Models ──────────────────────────────────────────────────
class Admin(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='admin')
    can_manage_projects  = db.Column(db.Boolean, default=True)
    can_manage_sections  = db.Column(db.Boolean, default=True)
    can_manage_content   = db.Column(db.Boolean, default=True)
    can_manage_team      = db.Column(db.Boolean, default=True)
    can_manage_logo      = db.Column(db.Boolean, default=False)
    can_manage_admins    = db.Column(db.Boolean, default=False)

class Section(db.Model):
    id        = db.Column(db.Integer, primary_key=True)
    name_ar   = db.Column(db.String(100), nullable=False)
    name_en   = db.Column(db.String(100), nullable=False)
    slug      = db.Column(db.String(50), unique=True, nullable=False)
    icon      = db.Column(db.String(50), default='folder')
    order_idx = db.Column(db.Integer, default=0)
    subsections = db.relationship('SubSection', backref='section', lazy=True, cascade='all, delete-orphan')
    projects    = db.relationship('Project', backref='section_rel', lazy=True)

class SubSection(db.Model):
    id         = db.Column(db.Integer, primary_key=True)
    section_id = db.Column(db.Integer, db.ForeignKey('section.id'), nullable=False)
    name_ar    = db.Column(db.String(100), nullable=False)
    name_en    = db.Column(db.String(100), nullable=False)
    slug       = db.Column(db.String(50), nullable=False)
    order_idx  = db.Column(db.Integer, default=0)
    projects   = db.relationship('Project', backref='subsection_rel', lazy=True)

class Project(db.Model):
    id             = db.Column(db.Integer, primary_key=True)
    title_ar       = db.Column(db.String(200), nullable=False)
    title_en       = db.Column(db.String(200), nullable=False)
    description_ar = db.Column(db.Text)
    description_en = db.Column(db.Text)
    section_id     = db.Column(db.Integer, db.ForeignKey('section.id'), nullable=False)
    subsection_id  = db.Column(db.Integer, db.ForeignKey('sub_section.id'))
    cover_image    = db.Column(db.String(255), nullable=False)
    video_url      = db.Column(db.String(500))
    link_url       = db.Column(db.String(500))
    tech_tags      = db.Column(db.String(500))
    images         = db.relationship('ProjectImage', backref='project', lazy=True, cascade='all, delete-orphan')
    order_idx      = db.Column(db.Integer, default=0)

class ProjectImage(db.Model):
    id         = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    image_path = db.Column(db.String(255), nullable=False)
    is_video   = db.Column(db.Boolean, default=False)
    order_idx  = db.Column(db.Integer, default=0)

class TeamMember(db.Model):
    id        = db.Column(db.Integer, primary_key=True)
    name_ar   = db.Column(db.String(100), nullable=False)
    name_en   = db.Column(db.String(100), nullable=False)
    role_ar   = db.Column(db.String(100), nullable=False)
    role_en   = db.Column(db.String(100), nullable=False)
    skills_ar = db.Column(db.Text)
    skills_en = db.Column(db.Text)
    image     = db.Column(db.String(255))

class SiteContent(db.Model):
    id       = db.Column(db.Integer, primary_key=True)
    key_name = db.Column(db.String(50), unique=True, nullable=False)
    text_ar  = db.Column(db.Text)
    text_en  = db.Column(db.Text)

@login_manager.user_loader
def load_user(uid):
    return db.session.get(Admin, int(uid))

# ── Permission helpers ──────────────────────────────────────
def super_admin_required(f):
    @wraps(f)
    @login_required
    def decorated(*a, **kw):
        if current_user.role != 'super_admin':
            abort(403)
        return f(*a, **kw)
    return decorated

def perm_required(perm):
    def dec(f):
        @wraps(f)
        @login_required
        def decorated(*a, **kw):
            if current_user.role == 'super_admin':
                return f(*a, **kw)
            if not getattr(current_user, perm, False):
                abort(403)
            return f(*a, **kw)
        return decorated
    return dec

def sections_json():
    secs = Section.query.order_by(Section.order_idx).all()
    out = []
    for s in secs:
        subs = [{'id':sub.id,'name_ar':sub.name_ar,'name_en':sub.name_en,'slug':sub.slug}
                for sub in sorted(s.subsections, key=lambda x: x.order_idx)]
        out.append({'id':s.id,'name_ar':s.name_ar,'name_en':s.name_en,'slug':s.slug,'icon':s.icon,'subsections':subs})
    return out

# ── Public routes ───────────────────────────────────────────
@app.route('/')
def index():
    sd = sections_json()
    projects = Project.query.order_by(Project.order_idx).all()
    members  = TeamMember.query.all()
    cr = SiteContent.query.all()
    content = {c.key_name: {'ar':c.text_ar,'en':c.text_en} for c in cr}
    pl = []
    for p in projects:
        pl.append({'id':p.id,'title_ar':p.title_ar,'title_en':p.title_en,
                    'desc_ar':p.description_ar,'desc_en':p.description_en,
                    'section_id':p.section_id,'subsection_id':p.subsection_id,
                    'cover':p.cover_image,'video':p.video_url,'link':p.link_url,
                    'tags':p.tech_tags.split(',') if p.tech_tags else [],
                    'images':[{'path':i.image_path,'is_video':i.is_video} for i in sorted(p.images, key=lambda x:x.order_idx)]})
    tl = []
    for t in members:
        tl.append({'id':t.id,'name_ar':t.name_ar,'name_en':t.name_en,
                    'role_ar':t.role_ar,'role_en':t.role_en,
                    'skills_ar':t.skills_ar.split(',') if t.skills_ar else [],
                    'skills_en':t.skills_en.split(',') if t.skills_en else [],
                    'image':t.image})
    return render_template('index.html', content=content, projects=pl, team=tl, sections=sd)

@app.route('/project/<int:pid>')
def project_detail(pid):
    p = db.session.get(Project, pid)
    if not p:
        abort(404)
    sec = db.session.get(Section, p.section_id)
    sub = db.session.get(SubSection, p.subsection_id) if p.subsection_id else None
    imgs = [{'path':i.image_path,'is_video':i.is_video} for i in sorted(p.images, key=lambda x:x.order_idx)]
    cr = SiteContent.query.all()
    content = {c.key_name:{'ar':c.text_ar,'en':c.text_en} for c in cr}
    return render_template('project_detail.html', project=p, section=sec,
                           subsection=sub, images=imgs, content=content, sections=sections_json())

# ── Auth ────────────────────────────────────────────────────
@app.route('/admin/login', methods=['GET','POST'])
def admin_login():
    if current_user.is_authenticated:
        return redirect(url_for('admin_dashboard'))
    if request.method == 'POST':
        u = request.form.get('username','').strip()
        pw = request.form.get('password','')
        user = Admin.query.filter_by(username=u).first()
        if user and check_password_hash(user.password_hash, pw):
            login_user(user)
            return redirect(url_for('admin_dashboard'))
        flash('اسم المستخدم أو كلمة المرور غير صحيحة','error')
    return render_template('admin/login.html')

@app.route('/admin/logout')
@login_required
def admin_logout():
    logout_user()
    return redirect(url_for('admin_login'))

@app.route('/admin')
@login_required
def admin_dashboard():
    stats = {'projects':Project.query.count(),'sections':Section.query.count(),
             'subsections':SubSection.query.count(),
             'team':TeamMember.query.count(),'admins':Admin.query.count()}
    return render_template('admin/dashboard.html', stats=stats)

# ── Sections CRUD ───────────────────────────────────────────
@app.route('/admin/sections')
@perm_required('can_manage_sections')
def admin_sections():
    return render_template('admin/sections.html', sections=Section.query.order_by(Section.order_idx).all())

@app.route('/admin/sections/add', methods=['POST'])
@perm_required('can_manage_sections')
def admin_section_add():
    db.session.add(Section(name_ar=request.form['name_ar'],name_en=request.form['name_en'],
        slug=request.form['slug'],icon=request.form.get('icon','folder'),
        order_idx=int(request.form.get('order_idx',0))))
    db.session.commit()
    flash('تم إضافة القسم','success')
    return redirect(url_for('admin_sections'))

@app.route('/admin/sections/edit/<int:sid>', methods=['POST'])
@perm_required('can_manage_sections')
def admin_section_edit(sid):
    s = db.session.get(Section, sid)
    if not s:
        abort(404)
    s.name_ar = request.form['name_ar']
    s.name_en = request.form['name_en']
    s.slug = request.form['slug']
    s.icon = request.form.get('icon','folder')
    s.order_idx = int(request.form.get('order_idx',0))
    db.session.commit()
    flash('تم تحديث القسم','success')
    return redirect(url_for('admin_sections'))

@app.route('/admin/sections/delete/<int:sid>')
@perm_required('can_manage_sections')
def admin_section_delete(sid):
    s = db.session.get(Section, sid)
    if s:
        db.session.delete(s)
        db.session.commit()
        flash('تم حذف القسم','success')
    return redirect(url_for('admin_sections'))

# ── SubSections CRUD ────────────────────────────────────────
@app.route('/admin/subsections/<int:section_id>')
@perm_required('can_manage_sections')
def admin_subsections(section_id):
    sec = db.session.get(Section, section_id)
    if not sec:
        abort(404)
    return render_template('admin/subsections.html', section=sec)

@app.route('/admin/subsections/<int:section_id>/add', methods=['POST'])
@perm_required('can_manage_sections')
def admin_subsection_add(section_id):
    db.session.add(SubSection(section_id=section_id,name_ar=request.form['name_ar'],
        name_en=request.form['name_en'],slug=request.form['slug'],
        order_idx=int(request.form.get('order_idx',0))))
    db.session.commit()
    flash('تم إضافة القسم الفرعي','success')
    return redirect(url_for('admin_subsections', section_id=section_id))

@app.route('/admin/subsections/edit/<int:sub_id>', methods=['POST'])
@perm_required('can_manage_sections')
def admin_subsection_edit(sub_id):
    sub = db.session.get(SubSection, sub_id)
    if not sub:
        abort(404)
    sub.name_ar = request.form['name_ar']
    sub.name_en = request.form['name_en']
    sub.slug = request.form['slug']
    sub.order_idx = int(request.form.get('order_idx',0))
    db.session.commit()
    flash('تم تحديث القسم الفرعي','success')
    return redirect(url_for('admin_subsections', section_id=sub.section_id))

@app.route('/admin/subsections/delete/<int:sub_id>')
@perm_required('can_manage_sections')
def admin_subsection_delete(sub_id):
    sub = db.session.get(SubSection, sub_id)
    if sub:
        sid = sub.section_id
        db.session.delete(sub)
        db.session.commit()
        flash('تم الحذف','success')
        return redirect(url_for('admin_subsections', section_id=sid))
    return redirect(url_for('admin_sections'))

# ── Projects CRUD ───────────────────────────────────────────
@app.route('/admin/projects')
@perm_required('can_manage_projects')
def admin_projects():
    sections = Section.query.order_by(Section.order_idx).all()
    return render_template('admin/projects.html', sections=sections)

@app.route('/admin/projects/add', methods=['GET','POST'])
@perm_required('can_manage_projects')
def admin_project_add():
    secs = Section.query.order_by(Section.order_idx).all()
    if request.method == 'POST':
        cover = ''
        if 'cover_file' in request.files and request.files['cover_file'].filename:
            cover = save_upload(request.files['cover_file']) or ''
        if not cover:
            flash('يجب رفع صورة غلاف','error')
            return render_template('admin/project_form.html', project=None, sections=secs)
        p = Project(
            title_ar=request.form['title_ar'], title_en=request.form['title_en'],
            description_ar=request.form.get('description_ar',''),
            description_en=request.form.get('description_en',''),
            section_id=int(request.form['section_id']),
            subsection_id=int(request.form['subsection_id']) if request.form.get('subsection_id') else None,
            cover_image=cover,
            video_url=request.form.get('video_url',''),
            link_url=request.form.get('link_url',''),
            tech_tags=request.form.get('tech_tags',''),
            order_idx=int(request.form.get('order_idx',0))
        )
        db.session.add(p)
        db.session.flush()
        # Handle gallery files
        gallery_files = request.files.getlist('gallery_files')
        for i, gf in enumerate(gallery_files):
            if gf and gf.filename:
                fn = save_upload(gf)
                if fn:
                    db.session.add(ProjectImage(
                        project_id=p.id, image_path=fn,
                        is_video=is_video(gf.filename), order_idx=i
                    ))
        db.session.commit()
        flash('تم إضافة المشروع','success')
        return redirect(url_for('admin_projects'))
    return render_template('admin/project_form.html', project=None, sections=secs)

@app.route('/admin/projects/edit/<int:pid>', methods=['GET','POST'])
@perm_required('can_manage_projects')
def admin_project_edit(pid):
    p = db.session.get(Project, pid)
    if not p:
        abort(404)
    secs = Section.query.order_by(Section.order_idx).all()
    if request.method == 'POST':
        p.title_ar = request.form['title_ar']
        p.title_en = request.form['title_en']
        p.description_ar = request.form.get('description_ar','')
        p.description_en = request.form.get('description_en','')
        p.section_id = int(request.form['section_id'])
        p.subsection_id = int(request.form['subsection_id']) if request.form.get('subsection_id') else None
        p.video_url = request.form.get('video_url','')
        p.link_url = request.form.get('link_url','')
        p.tech_tags = request.form.get('tech_tags','')
        p.order_idx = int(request.form.get('order_idx',0))
        # New cover?
        if 'cover_file' in request.files and request.files['cover_file'].filename:
            fn = save_upload(request.files['cover_file'])
            if fn:
                p.cover_image = fn
        # New gallery files
        gallery_files = request.files.getlist('gallery_files')
        existing_count = ProjectImage.query.filter_by(project_id=p.id).count()
        for i, gf in enumerate(gallery_files):
            if gf and gf.filename:
                fn = save_upload(gf)
                if fn:
                    db.session.add(ProjectImage(
                        project_id=p.id, image_path=fn,
                        is_video=is_video(gf.filename), order_idx=existing_count+i
                    ))
        db.session.commit()
        flash('تم التحديث','success')
        return redirect(url_for('admin_projects'))
    return render_template('admin/project_form.html', project=p, sections=secs)

@app.route('/admin/projects/delete/<int:pid>')
@perm_required('can_manage_projects')
def admin_project_delete(pid):
    p = db.session.get(Project, pid)
    if p:
        db.session.delete(p)
        db.session.commit()
        flash('تم الحذف','success')
    return redirect(url_for('admin_projects'))

@app.route('/admin/projects/gallery/delete/<int:img_id>')
@perm_required('can_manage_projects')
def admin_gallery_delete(img_id):
    img = db.session.get(ProjectImage, img_id)
    if img:
        pid = img.project_id
        # Try to delete actual file
        fpath = os.path.join(app.config['UPLOAD_FOLDER'], img.image_path)
        if os.path.exists(fpath):
            os.remove(fpath)
        db.session.delete(img)
        db.session.commit()
        flash('تم حذف الملف','success')
        return redirect(url_for('admin_project_edit', pid=pid))
    return redirect(url_for('admin_projects'))

# ── Team CRUD ───────────────────────────────────────────────
@app.route('/admin/team')
@perm_required('can_manage_team')
def admin_team():
    return render_template('admin/about.html', members=TeamMember.query.all())

@app.route('/admin/team/add', methods=['POST'])
@perm_required('can_manage_team')
def admin_team_add():
    img = ''
    if 'image' in request.files and request.files['image'].filename:
        img = save_upload(request.files['image']) or ''
    db.session.add(TeamMember(
        name_ar=request.form['name_ar'], name_en=request.form['name_en'],
        role_ar=request.form['role_ar'], role_en=request.form['role_en'],
        skills_ar=request.form.get('skills_ar',''),
        skills_en=request.form.get('skills_en',''), image=img
    ))
    db.session.commit()
    flash('تم الإضافة','success')
    return redirect(url_for('admin_team'))

@app.route('/admin/team/edit/<int:tid>', methods=['POST'])
@perm_required('can_manage_team')
def admin_team_edit(tid):
    t = db.session.get(TeamMember, tid)
    if not t:
        abort(404)
    t.name_ar = request.form['name_ar']
    t.name_en = request.form['name_en']
    t.role_ar = request.form['role_ar']
    t.role_en = request.form['role_en']
    t.skills_ar = request.form.get('skills_ar','')
    t.skills_en = request.form.get('skills_en','')
    if 'image' in request.files and request.files['image'].filename:
        fn = save_upload(request.files['image'])
        if fn:
            t.image = fn
    db.session.commit()
    flash('تم التحديث','success')
    return redirect(url_for('admin_team'))

@app.route('/admin/team/delete/<int:tid>')
@perm_required('can_manage_team')
def admin_team_delete(tid):
    t = db.session.get(TeamMember, tid)
    if t:
        db.session.delete(t)
        db.session.commit()
        flash('تم الحذف','success')
    return redirect(url_for('admin_team'))

# ── Content ─────────────────────────────────────────────────
@app.route('/admin/content')
@perm_required('can_manage_content')
def admin_content():
    return render_template('admin/site_content.html', content=SiteContent.query.all())

@app.route('/admin/content/save', methods=['POST'])
@perm_required('can_manage_content')
def admin_content_save():
    for key in request.form:
        if key.endswith('_ar'):
            base = key[:-3]
            ar = request.form.get(f'{base}_ar','')
            en = request.form.get(f'{base}_en','')
            sc = SiteContent.query.filter_by(key_name=base).first()
            if sc:
                sc.text_ar = ar
                sc.text_en = en
            else:
                db.session.add(SiteContent(key_name=base, text_ar=ar, text_en=en))
    db.session.commit()
    flash('تم الحفظ','success')
    return redirect(url_for('admin_content'))

# ── Admins Management (Super Admin) ────────────────────────
@app.route('/admin/admins')
@super_admin_required
def admin_admins():
    return render_template('admin/admins.html', admins=Admin.query.all())

@app.route('/admin/admins/add', methods=['POST'])
@super_admin_required
def admin_admins_add():
    u = request.form.get('username','').strip()
    pw = request.form.get('password','')
    if not u or not pw:
        flash('مطلوب اسم المستخدم وكلمة المرور','error')
        return redirect(url_for('admin_admins'))
    if Admin.query.filter_by(username=u).first():
        flash('اسم المستخدم موجود','error')
        return redirect(url_for('admin_admins'))
    db.session.add(Admin(
        username=u, password_hash=generate_password_hash(pw),
        role=request.form.get('role','admin'),
        can_manage_projects='can_manage_projects' in request.form,
        can_manage_sections='can_manage_sections' in request.form,
        can_manage_content='can_manage_content' in request.form,
        can_manage_team='can_manage_team' in request.form,
        can_manage_logo='can_manage_logo' in request.form,
        can_manage_admins='can_manage_admins' in request.form
    ))
    db.session.commit()
    flash('تم الإضافة','success')
    return redirect(url_for('admin_admins'))

@app.route('/admin/admins/update/<int:aid>', methods=['POST'])
@super_admin_required
def admin_admins_update(aid):
    a = db.session.get(Admin, aid)
    if not a:
        abort(404)
    if a.role == 'super_admin' and a.id == current_user.id:
        flash('لا يمكنك تعديل صلاحياتك','error')
        return redirect(url_for('admin_admins'))
    a.can_manage_projects = 'can_manage_projects' in request.form
    a.can_manage_sections = 'can_manage_sections' in request.form
    a.can_manage_content = 'can_manage_content' in request.form
    a.can_manage_team = 'can_manage_team' in request.form
    a.can_manage_logo = 'can_manage_logo' in request.form
    a.can_manage_admins = 'can_manage_admins' in request.form
    if request.form.get('new_password'):
        a.password_hash = generate_password_hash(request.form['new_password'])
    db.session.commit()
    flash('تم التحديث','success')
    return redirect(url_for('admin_admins'))

@app.route('/admin/admins/delete/<int:aid>')
@super_admin_required
def admin_admins_delete(aid):
    a = db.session.get(Admin, aid)
    if a and a.id != current_user.id:
        db.session.delete(a)
        db.session.commit()
        flash('تم الحذف','success')
    return redirect(url_for('admin_admins'))

# ── API ─────────────────────────────────────────────────────
@app.route('/api/subsections/<int:section_id>')
def api_subsections(section_id):
    subs = SubSection.query.filter_by(section_id=section_id).order_by(SubSection.order_idx).all()
    return jsonify([{'id':s.id,'name_ar':s.name_ar,'name_en':s.name_en,'slug':s.slug} for s in subs])

# ── Errors ──────────────────────────────────────────────────
@app.errorhandler(403)
def err403(e):
    return render_template('admin/login.html', error='ليس لديك صلاحية'), 403

@app.errorhandler(404)
def err404(e):
    return render_template('index.html', content={}, projects=[], team=[], sections=sections_json()), 404

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
''')

# ═══════════════════════════════════════════════════════════
# 2. BASE.HTML - Fix script order (translations bug fix)
# ═══════════════════════════════════════════════════════════
print("📦 Writing templates/base.html...")
w('templates/base.html', r'''<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NetPal Portfolio</title>
    <meta name="description" content="NetPal — نبتكر حضوراً بصرياً يخطف الأنظار">
    <meta name="theme-color" content="#07444E">
    <link rel="stylesheet" href="{{ url_for('static', filename='css/main.css') }}">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
</head>
<body class="theme-dark">
    <div id="custom-cursor"><span class="cursor-text"></span></div>
    <div id="cursor-trail"></div>

    <div id="preloader">
        <svg id="logo-svg-draw" viewBox="0 0 200 60" width="200" xmlns="http://www.w3.org/2000/svg">
            <text x="100" y="45" text-anchor="middle" font-family="Co Headline,sans-serif" font-size="40"
                  font-weight="700" fill="none" stroke="var(--primary)" stroke-width="1.5"
                  class="stroke-draw">NetPal</text>
        </svg>
    </div>

    <nav class="floating-nav">
        <a href="/" class="nav-logo">
            <img src="{{ url_for('static', filename='images/لوغو نيتبال جديد-0١.svg') }}" alt="NetPal" class="nav-logo-img">
        </a>
        <div class="nav-links">
            <a href="/#about" data-i18n="nav_about">من نحن</a>
            <a href="/#portfolio" data-i18n="nav_portfolio">أعمالنا</a>
            <a href="/#contact" data-i18n="nav_contact">تواصل معنا</a>
        </div>
        <div class="nav-controls">
            <button id="lang-toggle" aria-label="Toggle Language" class="nav-btn">EN</button>
            <button id="theme-toggle" aria-label="Toggle Theme" class="nav-btn">
                <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
                <svg class="icon-sun hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            </button>
        </div>
    </nav>

    <div id="smooth-wrapper"><div id="smooth-content">
        {% block content %}{% endblock %}
        <footer class="site-footer">
            <div class="footer-content container">
                <img src="{{ url_for('static', filename='images/لوغو نيتبال جديد-0١.svg') }}" alt="NetPal" class="footer-logo">
                <p class="footer-madeby">جميع الحقوق محفوظة NetPal 2026</p>
            </div>
        </footer>
    </div></div>

    <!-- DATA SCRIPTS FIRST - before page-specific scripts -->
    <script>
        window.SITE_CONTENT = {{ content | tojson | safe if content is defined else '{}' }};
        window.PROJECTS_DATA = {{ projects | tojson | safe if projects is defined else '[]' }};
        window.TEAM_DATA = {{ team | tojson | safe if team is defined else '[]' }};
        window.SECTIONS_DATA = {{ sections | tojson | safe if sections is defined else '[]' }};
    </script>
    {% block extra_scripts %}{% endblock %}
    <script src="{{ url_for('static', filename='js/app.js') }}"></script>
</body>
</html>''')

# ═══════════════════════════════════════════════════════════
# 3. INDEX.HTML - Fix translations (Object.assign AFTER data)
# ═══════════════════════════════════════════════════════════
print("📦 Writing templates/index.html...")
w('templates/index.html', r'''{% extends "base.html" %}
{% block content %}
<section class="hero" id="hero">
    <div id="three-canvas-container"></div>
    <div class="hero-logo-container"><img src="{{ url_for('static', filename='images/لوغو نيتبال جديد-0١.svg') }}" alt="NetPal" class="hero-main-logo"></div>
    <div class="hero-content">
        <h1 class="hero-title" data-i18n="hero_title">نحن فريق NetPal — نبتكر حضوراً بصرياً يخطف الأنظار ويترك أثراً لا يُنسى</h1>
        <p class="hero-subtitle" data-i18n="hero_subtitle">تصميم | موشن ومونتاج | برمجة | تسويق</p>
        <div class="hero-cta">
            <a href="#portfolio" class="btn btn-primary" data-i18n="cta_portfolio">شوف أعمالنا</a>
            <a href="#contact" class="btn btn-outline" data-i18n="cta_contact">تواصل معنا</a>
        </div>
    </div>
    <div class="scroll-indicator"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M12 5v14M19 12l-7 7-7-7"/></svg></div>
</section>

<section id="about" class="container section-3d">
    <div class="section-header"><h2 class="section-title" data-i18n="nav_about">من نحن</h2></div>
    <div class="about-grid">
        <div class="about-text">
            <h3 data-i18n="about_title">فريق واحد. أربع مهارات. إبداع بلا حدود.</h3>
            <p data-i18n="about_text">نحن في NetPal نؤمن بأن التصميم ليس مجرد شكل.</p>
            <ul class="about-features">
                <li data-i18n="feat_1">تصميم مبني على هدف</li>
                <li data-i18n="feat_2">نظام شغل واضح</li>
                <li data-i18n="feat_3">تسليم ملفات جاهز فوراً</li>
            </ul>
        </div>
        <div class="team-grid" id="team-container"></div>
    </div>
</section>

<section id="portfolio" class="container section-3d">
    <div class="section-header"><h2 class="section-title" data-i18n="nav_portfolio">أعمالنا</h2></div>
    <div class="portfolio-tabs" id="section-tabs"></div>
    <div class="portfolio-subcategories" id="sub-tabs"></div>
    <div class="projects-grid" id="projects-container"></div>
</section>

<section id="contact" class="container contact-section section-3d">
    <div class="contact-bg"></div>
    <div class="section-header"><h2 class="section-title" data-i18n="contact_title">جاهزين للمشروع الجاي</h2></div>
    <div class="contact-actions">
        <a href="https://wa.me/{{ content.get('contact_whatsapp',{}).get('ar','') }}" target="_blank" class="contact-btn" rel="noopener">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
            <span data-i18n="btn_whatsapp">واتساب</span>
        </a>
        <a href="mailto:{{ content.get('contact_email',{}).get('ar','') }}" class="contact-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
            <span data-i18n="btn_email">إيميل</span>
        </a>
    </div>
</section>
{% endblock %}

{% block extra_scripts %}
<script>
Object.assign(window.SITE_CONTENT, {
    nav_about:{ar:'من نحن',en:'About Us'},
    nav_portfolio:{ar:'أعمالنا',en:'Portfolio'},
    nav_contact:{ar:'تواصل معنا',en:'Contact'},
    cta_portfolio:{ar:'شوف أعمالنا',en:'See Our Work'},
    cta_contact:{ar:'تواصل معنا',en:'Contact Us'},
    feat_1:{ar:'تصميم مبني على هدف',en:'Purpose-Driven Design'},
    feat_2:{ar:'نظام شغل واضح',en:'Clear Workflow'},
    feat_3:{ar:'تسليم ملفات جاهز فوراً',en:'Immediate File Delivery'},
    contact_title:{ar:'جاهزين للمشروع الجاي',en:'Ready for the Next Project'},
    btn_whatsapp:{ar:'واتساب',en:'WhatsApp'},
    btn_email:{ar:'إيميل',en:'Email'},
});
</script>
{% endblock %}''')

# ═══════════════════════════════════════════════════════════
# 4. PROJECT_DETAIL.HTML - Original-size gallery  
# ═══════════════════════════════════════════════════════════
print("📦 Writing templates/project_detail.html...")
w('templates/project_detail.html', r'''{% extends "base.html" %}
{% block content %}
<section class="project-detail-page section-3d">
    <div class="container">
        <nav class="breadcrumb">
            <a href="/#portfolio" data-i18n="nav_portfolio">أعمالنا</a>
            <span class="sep">/</span>
            <span data-ar="{{ section.name_ar }}" data-en="{{ section.name_en }}">{{ section.name_ar }}</span>
            {% if subsection %}
            <span class="sep">/</span>
            <span data-ar="{{ subsection.name_ar }}" data-en="{{ subsection.name_en }}">{{ subsection.name_ar }}</span>
            {% endif %}
        </nav>
        <div class="pd-header">
            <h1 class="pd-title" data-ar="{{ project.title_ar }}" data-en="{{ project.title_en }}">{{ project.title_ar }}</h1>
            {% if project.tech_tags %}<div class="pd-tags">{% for t in project.tech_tags.split(',') %}<span class="skill-tag">{{ t.strip() }}</span>{% endfor %}</div>{% endif %}
        </div>
        <div class="pd-cover"><img src="/static/uploads/{{ project.cover_image }}" alt="{{ project.title_en }}"></div>
        <div class="pd-body">
            <p class="pd-desc" data-ar="{{ project.description_ar }}" data-en="{{ project.description_en }}">{{ project.description_ar }}</p>
            {% if project.link_url %}<a href="{{ project.link_url }}" target="_blank" rel="noopener" class="btn btn-primary pd-link" data-i18n="site_visit">زيارة الموقع</a>{% endif %}
        </div>
        {% if project.video_url %}
        <div class="pd-video">
            <h3 class="pd-section-title" data-i18n="pd_video">فيديو المشروع</h3>
            <div class="video-wrapper">
                {% if 'youtube' in project.video_url or 'youtu.be' in project.video_url %}
                <iframe src="{{ project.video_url }}" frameborder="0" allowfullscreen></iframe>
                {% else %}
                <video controls><source src="{{ project.video_url }}"></video>
                {% endif %}
            </div>
        </div>
        {% endif %}
        {% if images %}
        <div class="pd-gallery-section">
            <h3 class="pd-section-title" data-i18n="pd_gallery">معرض الصور والفيديوهات</h3>
            <div class="pd-gallery">
                {% for item in images %}
                {% if item.is_video %}
                <div class="gallery-item gallery-video">
                    <video controls preload="metadata">
                        <source src="/static/uploads/{{ item.path }}">
                    </video>
                </div>
                {% else %}
                <div class="gallery-item" data-index="{{ loop.index0 }}">
                    <img src="/static/uploads/{{ item.path }}" alt="Gallery" loading="lazy">
                </div>
                {% endif %}
                {% endfor %}
            </div>
        </div>
        {% endif %}
        <div class="pd-back"><a href="/#portfolio" class="btn btn-outline" data-i18n="back_portfolio">العودة للأعمال</a></div>
    </div>
</section>

<!-- Lightbox -->
<div id="lightbox" class="lightbox-overlay" style="display:none">
    <button class="lb-close">&times;</button>
    <button class="lb-prev">&#10094;</button>
    <button class="lb-next">&#10095;</button>
    <div class="lb-content"><img id="lb-img" src="" alt=""></div>
</div>
{% endblock %}

{% block extra_scripts %}
<script>
Object.assign(window.SITE_CONTENT, {
    nav_portfolio:{ar:'أعمالنا',en:'Portfolio'},
    site_visit:{ar:'زيارة الموقع',en:'Visit Website'},
    back_portfolio:{ar:'العودة للأعمال',en:'Back to Portfolio'},
    pd_video:{ar:'فيديو المشروع',en:'Project Video'},
    pd_gallery:{ar:'معرض الصور والفيديوهات',en:'Images & Videos Gallery'},
});

// Lightbox
(function(){
    const lb=document.getElementById('lightbox');
    if(!lb) return;
    const lbImg=document.getElementById('lb-img');
    const items=document.querySelectorAll('.gallery-item:not(.gallery-video)');
    let cur=0;
    const srcs=[];
    items.forEach((el,i)=>{
        const img=el.querySelector('img');
        if(img){srcs.push(img.src);el.style.cursor='pointer';
        el.addEventListener('click',()=>{cur=i;lbImg.src=srcs[cur];lb.style.display='flex'})}
    });
    lb.querySelector('.lb-close').addEventListener('click',()=>lb.style.display='none');
    lb.querySelector('.lb-prev').addEventListener('click',()=>{cur=(cur-1+srcs.length)%srcs.length;lbImg.src=srcs[cur]});
    lb.querySelector('.lb-next').addEventListener('click',()=>{cur=(cur+1)%srcs.length;lbImg.src=srcs[cur]});
    lb.addEventListener('click',(e)=>{if(e.target===lb)lb.style.display='none'});
    document.addEventListener('keydown',(e)=>{
        if(lb.style.display==='none')return;
        if(e.key==='Escape')lb.style.display='none';
        if(e.key==='ArrowLeft')lb.querySelector('.lb-prev').click();
        if(e.key==='ArrowRight')lb.querySelector('.lb-next').click();
    });
})();
</script>
{% endblock %}''')

# ═══════════════════════════════════════════════════════════
# 5. ADMIN TEMPLATES
# ═══════════════════════════════════════════════════════════

print("📦 Writing templates/admin/base.html...")
w('templates/admin/base.html', r'''<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>NetPal Admin</title>
<style>
@font-face{font-family:'Co Headline';src:url('/static/fonts/Co Headline.otf') format('opentype')}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Co Headline',sans-serif;background:#0a0a0a;color:#e0e0e0;cursor:default!important}
a,button{cursor:default!important}
.al{display:flex;min-height:100vh}
.sb{width:250px;background:#111;border-left:1px solid rgba(93,203,202,.15);padding:20px 0;position:fixed;height:100vh;overflow-y:auto;z-index:100}
.sb .lo{text-align:center;padding:20px;border-bottom:1px solid rgba(93,203,202,.1);margin-bottom:20px}
.sb .lo img{width:80px} .sb .lo h2{color:#5DCBCA;font-size:1rem;margin-top:8px}
.sb nav a{display:flex;align-items:center;gap:10px;padding:12px 25px;color:#aaa;transition:.3s;font-size:.95rem;border-right:3px solid transparent;text-decoration:none}
.sb nav a:hover,.sb nav a.ac{color:#5DCBCA;background:rgba(93,203,202,.05);border-right-color:#5DCBCA}
.sb nav a svg{width:18px;height:18px;flex-shrink:0}
.mc{margin-right:250px;flex:1;padding:30px}
.tb{display:flex;justify-content:space-between;align-items:center;margin-bottom:30px;padding-bottom:15px;border-bottom:1px solid rgba(255,255,255,.05)}
.tb h1{font-size:1.6rem;color:#5DCBCA} .tb .ui{display:flex;align-items:center;gap:15px}
.tb .ui span{color:#888;font-size:.9rem}
.ba{padding:10px 25px;background:#5DCBCA;color:#0a0a0a;border:none;border-radius:8px;font-family:inherit;font-weight:700;cursor:default!important;transition:.3s;font-size:.9rem;text-decoration:none;display:inline-flex;align-items:center;gap:5px}
.ba:hover{background:#4ab8b7;transform:translateY(-1px)} .bd{background:#e74c3c;color:#fff} .bd:hover{background:#c0392b}
.be{background:#f39c12;color:#0a0a0a} .be:hover{background:#e67e22}
.bo{background:transparent;border:1px solid rgba(93,203,202,.3);color:#5DCBCA} .bo:hover{background:rgba(93,203,202,.1)}
.cd{background:#161616;border:1px solid rgba(255,255,255,.05);border-radius:12px;padding:25px;margin-bottom:20px}
.cd h3{color:#5DCBCA;margin-bottom:15px;font-size:1.1rem}
table{width:100%;border-collapse:collapse}
th,td{padding:12px 15px;text-align:right;border-bottom:1px solid rgba(255,255,255,.05);font-size:.9rem}
th{color:#5DCBCA;font-weight:700}
.fg{margin-bottom:15px} .fg label{display:block;margin-bottom:5px;color:#888;font-size:.85rem}
.fg input,.fg textarea,.fg select{width:100%;padding:12px;background:#1a1a1a;border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#e0e0e0;font-family:inherit;font-size:.95rem}
.fg input:focus,.fg textarea:focus,.fg select:focus{outline:none;border-color:#5DCBCA}
.fg textarea{min-height:100px;resize:vertical}
.fr{display:grid;grid-template-columns:1fr 1fr;gap:15px}
.fm{padding:12px 20px;border-radius:8px;margin-bottom:20px;font-size:.9rem}
.fs{background:rgba(93,203,202,.1);border:1px solid rgba(93,203,202,.3);color:#5DCBCA}
.fe{background:rgba(231,76,60,.1);border:1px solid rgba(231,76,60,.3);color:#e74c3c}
.sg{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:20px;margin-bottom:30px}
.sc{background:#161616;border:1px solid rgba(255,255,255,.05);border-radius:12px;padding:25px;text-align:center;transition:.3s}
.sc:hover{border-color:rgba(93,203,202,.3);transform:translateY(-3px)}
.sc .n{font-size:2.5rem;color:#5DCBCA;font-weight:700} .sc .l{color:#888;font-size:.85rem;margin-top:5px}
.bg{padding:3px 10px;border-radius:20px;font-size:.75rem;font-weight:700}
.bg-a{background:rgba(93,203,202,.2);color:#5DCBCA} .bg-s{background:rgba(255,193,7,.2);color:#ffc107}
.pg{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.pc{display:flex;align-items:center;gap:5px;font-size:.85rem} .pc input[type=checkbox]{accent-color:#5DCBCA}
.edit-form{display:none;background:#1a1a1a;border:1px solid rgba(93,203,202,.15);border-radius:10px;padding:20px;margin-top:10px}
.edit-form.show{display:block}
.actions-cell{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.gallery-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;margin:15px 0}
.gallery-thumb{position:relative;border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,.1)}
.gallery-thumb img,.gallery-thumb video{width:100%;height:80px;object-fit:cover}
.gallery-thumb .del-btn{position:absolute;top:5px;right:5px;background:#e74c3c;color:#fff;border:none;border-radius:50%;width:22px;height:22px;font-size:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;text-decoration:none}
.section-group{margin-bottom:30px;border:1px solid rgba(93,203,202,.15);border-radius:12px;overflow:hidden}
.section-group-header{background:rgba(93,203,202,.08);padding:15px 20px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;transition:.3s}
.section-group-header:hover{background:rgba(93,203,202,.12)}
.section-group-header h4{color:#5DCBCA;font-size:1rem}
.section-group-body{padding:0}
.subsection-group{border-top:1px solid rgba(255,255,255,.03)}
.subsection-group-header{padding:10px 25px;background:rgba(255,255,255,.02);color:#aaa;font-size:.85rem;cursor:pointer}
.subsection-group-header:hover{background:rgba(255,255,255,.05);color:#5DCBCA}
.project-row{display:flex;align-items:center;gap:15px;padding:12px 25px;border-top:1px solid rgba(255,255,255,.03);transition:.2s}
.project-row:hover{background:rgba(93,203,202,.03)}
.project-row .p-thumb{width:60px;height:40px;border-radius:6px;object-fit:cover;border:1px solid rgba(255,255,255,.1)}
.project-row .p-info{flex:1}
.project-row .p-title{font-size:.95rem;color:#e0e0e0}
.project-row .p-sub{font-size:.8rem;color:#666}
.collapse{display:none}.collapse.show{display:block}
@media(max-width:768px){.sb{width:60px}.sb .lo h2,.sb nav a span{display:none}.mc{margin-right:60px}.fr{grid-template-columns:1fr}}
</style></head><body>
<div class="al">
<aside class="sb">
<div class="lo"><img src="/static/images/لوغو نيتبال جديد-0١.svg" alt="NetPal"><h2>لوحة التحكم</h2></div>
<nav>
<a href="{{ url_for('admin_dashboard') }}" class="{% if request.endpoint=='admin_dashboard' %}ac{% endif %}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg> <span>الرئيسية</span></a>
{% if current_user.role=='super_admin' or current_user.can_manage_sections %}
<a href="{{ url_for('admin_sections') }}" class="{% if 'section' in request.endpoint %}ac{% endif %}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> <span>الأقسام</span></a>
{% endif %}
{% if current_user.role=='super_admin' or current_user.can_manage_projects %}
<a href="{{ url_for('admin_projects') }}" class="{% if 'project' in request.endpoint %}ac{% endif %}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg> <span>المشاريع</span></a>
{% endif %}
{% if current_user.role=='super_admin' or current_user.can_manage_team %}
<a href="{{ url_for('admin_team') }}" class="{% if 'team' in request.endpoint %}ac{% endif %}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> <span>الفريق</span></a>
{% endif %}
{% if current_user.role=='super_admin' or current_user.can_manage_content %}
<a href="{{ url_for('admin_content') }}" class="{% if 'content' in request.endpoint %}ac{% endif %}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> <span>المحتوى</span></a>
{% endif %}
{% if current_user.role=='super_admin' or current_user.can_manage_admins %}
<a href="{{ url_for('admin_admins') }}" class="{% if 'admins' in request.endpoint %}ac{% endif %}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> <span>المشرفون</span></a>
{% endif %}
</nav></aside>
<main class="mc">
<div class="tb"><h1>{% block pt %}لوحة التحكم{% endblock %}</h1>
<div class="ui"><span>{{ current_user.username }} ({{ current_user.role }})</span>
<a href="{{ url_for('admin_logout') }}" class="ba bo">خروج</a>
<a href="/" class="ba bo" target="_blank">الموقع</a></div></div>
{% with messages=get_flashed_messages(with_categories=true) %}{% if messages %}{% for cat,msg in messages %}
<div class="fm {% if cat=='success' %}fs{% else %}fe{% endif %}">{{ msg }}</div>
{% endfor %}{% endif %}{% endwith %}
{% block ac %}{% endblock %}
</main></div></body></html>''')

print("📦 Writing templates/admin/login.html...")
w('templates/admin/login.html', r'''<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>NetPal Admin</title>
<style>
@font-face{font-family:'Co Headline';src:url('/static/fonts/Co Headline.otf') format('opentype')}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Co Headline',sans-serif;background:#07444E;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh}
.box{background:rgba(0,0,0,.3);padding:50px 40px;border-radius:20px;border:1px solid rgba(93,203,202,.2);width:400px;text-align:center}
.box h1{color:#5DCBCA;margin-bottom:30px;font-size:2rem}
.box input{width:100%;padding:15px;margin-bottom:15px;border:1px solid rgba(93,203,202,.3);background:rgba(255,255,255,.05);border-radius:10px;color:#fff;font-family:inherit;font-size:1rem}
.box input::placeholder{color:rgba(255,255,255,.4)} .box input:focus{outline:none;border-color:#5DCBCA}
.box button{width:100%;padding:15px;background:#5DCBCA;color:#07444E;border:none;border-radius:10px;font-size:1.1rem;font-weight:700;cursor:pointer;font-family:inherit;transition:.3s}
.box button:hover{background:#4ab8b7;transform:translateY(-2px)}
.flash{background:rgba(255,0,0,.2);border:1px solid rgba(255,0,0,.4);padding:10px;border-radius:8px;margin-bottom:15px;font-size:.9rem}
.err{color:#ff6b6b;margin-bottom:15px}
</style></head><body>
<div class="box">
<h1>NetPal Admin</h1>
{% if error is defined and error %}<p class="err">{{ error }}</p>{% endif %}
{% with messages = get_flashed_messages() %}{% if messages %}{% for m in messages %}<div class="flash">{{ m }}</div>{% endfor %}{% endif %}{% endwith %}
<form method="POST">
<input type="text" name="username" placeholder="اسم المستخدم" required autocomplete="username">
<input type="password" name="password" placeholder="كلمة المرور" required autocomplete="current-password">
<button type="submit">دخول</button>
</form></div></body></html>''')

print("📦 Writing templates/admin/dashboard.html...")
w('templates/admin/dashboard.html', r'''{% extends "admin/base.html" %}
{% block pt %}الرئيسية{% endblock %}
{% block ac %}
<div class="sg">
<div class="sc"><div class="n">{{ stats.projects }}</div><div class="l">مشروع</div></div>
<div class="sc"><div class="n">{{ stats.sections }}</div><div class="l">قسم رئيسي</div></div>
<div class="sc"><div class="n">{{ stats.subsections }}</div><div class="l">قسم فرعي</div></div>
<div class="sc"><div class="n">{{ stats.team }}</div><div class="l">عضو فريق</div></div>
<div class="sc"><div class="n">{{ stats.admins }}</div><div class="l">مشرف</div></div>
</div>
<div class="cd"><h3>مرحباً {{ current_user.username }}!</h3><p style="color:#888">أهلاً بك في لوحة تحكم NetPal.</p></div>
{% endblock %}''')

# ── SECTIONS with EDIT ──
print("📦 Writing templates/admin/sections.html...")
w('templates/admin/sections.html', r'''{% extends "admin/base.html" %}
{% block pt %}إدارة الأقسام{% endblock %}
{% block ac %}
<div class="cd"><h3>إضافة قسم</h3>
<form method="POST" action="{{ url_for('admin_section_add') }}">
<div class="fr"><div class="fg"><label>الاسم بالعربي</label><input name="name_ar" required></div>
<div class="fg"><label>الاسم بالإنجليزي</label><input name="name_en" required></div></div>
<div class="fr"><div class="fg"><label>Slug</label><input name="slug" required></div>
<div class="fg"><label>الترتيب</label><input name="order_idx" type="number" value="0"></div></div>
<div class="fg"><label>أيقونة</label><input name="icon" value="folder"></div>
<button class="ba" type="submit">إضافة</button></form></div>
<div class="cd"><h3>الأقسام</h3><table>
<tr><th>AR</th><th>EN</th><th>Slug</th><th>ترتيب</th><th>فرعية</th><th>إجراءات</th></tr>
{% for s in sections %}<tr>
<td>{{ s.name_ar }}</td><td>{{ s.name_en }}</td><td>{{ s.slug }}</td><td>{{ s.order_idx }}</td>
<td>{{ s.subsections|length }}</td>
<td class="actions-cell">
<a href="{{ url_for('admin_subsections',section_id=s.id) }}" class="ba bo" style="padding:5px 12px">الفرعية</a>
<button class="ba be" style="padding:5px 12px" onclick="document.getElementById('edit-sec-{{s.id}}').classList.toggle('show')">تعديل</button>
<a href="{{ url_for('admin_section_delete',sid=s.id) }}" class="ba bd" style="padding:5px 12px" onclick="return confirm('حذف القسم وكل مشاريعه الفرعية؟')">حذف</a>
</td></tr>
<tr><td colspan="6">
<form class="edit-form" id="edit-sec-{{s.id}}" method="POST" action="{{ url_for('admin_section_edit',sid=s.id) }}">
<div class="fr"><div class="fg"><label>AR</label><input name="name_ar" value="{{ s.name_ar }}" required></div>
<div class="fg"><label>EN</label><input name="name_en" value="{{ s.name_en }}" required></div></div>
<div class="fr"><div class="fg"><label>Slug</label><input name="slug" value="{{ s.slug }}" required></div>
<div class="fg"><label>ترتيب</label><input name="order_idx" type="number" value="{{ s.order_idx }}"></div></div>
<div class="fg"><label>أيقونة</label><input name="icon" value="{{ s.icon }}"></div>
<button class="ba" type="submit">حفظ التعديلات</button></form>
</td></tr>
{% endfor %}</table></div>
{% endblock %}''')

# ── SUBSECTIONS with EDIT ──
print("📦 Writing templates/admin/subsections.html...")
w('templates/admin/subsections.html', r'''{% extends "admin/base.html" %}
{% block pt %}الأقسام الفرعية — {{ section.name_ar }}{% endblock %}
{% block ac %}
<div class="cd"><h3>إضافة قسم فرعي لـ "{{ section.name_ar }}"</h3>
<form method="POST" action="{{ url_for('admin_subsection_add',section_id=section.id) }}">
<div class="fr"><div class="fg"><label>AR</label><input name="name_ar" required></div>
<div class="fg"><label>EN</label><input name="name_en" required></div></div>
<div class="fr"><div class="fg"><label>Slug</label><input name="slug" required></div>
<div class="fg"><label>ترتيب</label><input name="order_idx" type="number" value="0"></div></div>
<button class="ba" type="submit">إضافة</button></form></div>
<div class="cd"><h3>الأقسام الفرعية</h3><table>
<tr><th>AR</th><th>EN</th><th>Slug</th><th>ترتيب</th><th>مشاريع</th><th>إجراءات</th></tr>
{% for sub in section.subsections|sort(attribute='order_idx') %}<tr>
<td>{{ sub.name_ar }}</td><td>{{ sub.name_en }}</td><td>{{ sub.slug }}</td><td>{{ sub.order_idx }}</td>
<td>{{ sub.projects|length }}</td>
<td class="actions-cell">
<button class="ba be" style="padding:5px 12px" onclick="document.getElementById('edit-sub-{{sub.id}}').classList.toggle('show')">تعديل</button>
<a href="{{ url_for('admin_subsection_delete',sub_id=sub.id) }}" class="ba bd" style="padding:5px 12px" onclick="return confirm('حذف؟')">حذف</a>
</td></tr>
<tr><td colspan="6">
<form class="edit-form" id="edit-sub-{{sub.id}}" method="POST" action="{{ url_for('admin_subsection_edit',sub_id=sub.id) }}">
<div class="fr"><div class="fg"><label>AR</label><input name="name_ar" value="{{ sub.name_ar }}" required></div>
<div class="fg"><label>EN</label><input name="name_en" value="{{ sub.name_en }}" required></div></div>
<div class="fr"><div class="fg"><label>Slug</label><input name="slug" value="{{ sub.slug }}" required></div>
<div class="fg"><label>ترتيب</label><input name="order_idx" type="number" value="{{ sub.order_idx }}"></div></div>
<button class="ba" type="submit">حفظ التعديلات</button></form>
</td></tr>
{% endfor %}</table></div>
<a href="{{ url_for('admin_sections') }}" class="ba bo">العودة للأقسام</a>
{% endblock %}''')

# ── PROJECTS organized by section ──
print("📦 Writing templates/admin/projects.html...")
w('templates/admin/projects.html', r'''{% extends "admin/base.html" %}
{% block pt %}إدارة المشاريع{% endblock %}
{% block ac %}
<div style="margin-bottom:20px;display:flex;justify-content:space-between;align-items:center">
<a href="{{ url_for('admin_project_add') }}" class="ba">+ إضافة مشروع</a>
<span style="color:#888;font-size:.85rem">إجمالي: {{ sections|sum(attribute='projects'|count) if false else '' }}{{ sections|map(attribute='projects')|map('length')|sum }} مشروع</span>
</div>
{% for sec in sections %}
<div class="section-group">
<div class="section-group-header" onclick="this.nextElementSibling.classList.toggle('show')">
<h4>{{ sec.name_ar }} — {{ sec.name_en }} ({{ sec.projects|length }})</h4>
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5DCBCA" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
</div>
<div class="collapse show">
{% set no_sub = sec.projects|selectattr('subsection_id','none')|list %}
{% if no_sub %}
<div class="subsection-group">
<div class="subsection-group-header">بدون قسم فرعي ({{ no_sub|length }})</div>
{% for p in no_sub %}
<div class="project-row">
<img class="p-thumb" src="/static/uploads/{{ p.cover_image }}" alt="" onerror="this.style.display='none'">
<div class="p-info"><div class="p-title">{{ p.title_ar }}</div><div class="p-sub">{{ p.title_en }}</div></div>
<div class="actions-cell">
<a href="{{ url_for('admin_project_edit',pid=p.id) }}" class="ba be" style="padding:5px 12px">تعديل</a>
<a href="{{ url_for('admin_project_delete',pid=p.id) }}" class="ba bd" style="padding:5px 12px" onclick="return confirm('حذف؟')">حذف</a>
<a href="{{ url_for('project_detail',pid=p.id) }}" class="ba bo" style="padding:5px 12px" target="_blank">عرض</a>
</div></div>
{% endfor %}
</div>
{% endif %}
{% for sub in sec.subsections|sort(attribute='order_idx') %}
{% if sub.projects|length > 0 %}
<div class="subsection-group">
<div class="subsection-group-header" onclick="this.nextElementSibling.classList.toggle('show')">{{ sub.name_ar }} — {{ sub.name_en }} ({{ sub.projects|length }})</div>
<div class="collapse show">
{% for p in sub.projects|sort(attribute='order_idx') %}
<div class="project-row">
<img class="p-thumb" src="/static/uploads/{{ p.cover_image }}" alt="" onerror="this.style.display='none'">
<div class="p-info"><div class="p-title">{{ p.title_ar }}</div><div class="p-sub">{{ p.title_en }}</div></div>
<div class="actions-cell">
<a href="{{ url_for('admin_project_edit',pid=p.id) }}" class="ba be" style="padding:5px 12px">تعديل</a>
<a href="{{ url_for('admin_project_delete',pid=p.id) }}" class="ba bd" style="padding:5px 12px" onclick="return confirm('حذف؟')">حذف</a>
<a href="{{ url_for('project_detail',pid=p.id) }}" class="ba bo" style="padding:5px 12px" target="_blank">عرض</a>
</div></div>
{% endfor %}
</div></div>
{% endif %}
{% endfor %}
</div></div>
{% endfor %}
{% endblock %}''')

# ── PROJECT FORM with multi-image upload ──
print("📦 Writing templates/admin/project_form.html...")
w('templates/admin/project_form.html', r'''{% extends "admin/base.html" %}
{% block pt %}{{ 'تعديل' if project else 'إضافة' }} مشروع{% endblock %}
{% block ac %}
<div class="cd">
<form method="POST" enctype="multipart/form-data" action="{{ url_for('admin_project_edit',pid=project.id) if project else url_for('admin_project_add') }}">
<div class="fr"><div class="fg"><label>عنوان AR</label><input name="title_ar" value="{{ project.title_ar if project else '' }}" required></div>
<div class="fg"><label>عنوان EN</label><input name="title_en" value="{{ project.title_en if project else '' }}" required></div></div>
<div class="fr"><div class="fg"><label>وصف AR</label><textarea name="description_ar">{{ project.description_ar if project else '' }}</textarea></div>
<div class="fg"><label>وصف EN</label><textarea name="description_en">{{ project.description_en if project else '' }}</textarea></div></div>
<div class="fr"><div class="fg"><label>القسم</label><select name="section_id" id="ss" required>
<option value="">اختر القسم</option>{% for s in sections %}<option value="{{ s.id }}" {% if project and project.section_id==s.id %}selected{% endif %}>{{ s.name_ar }} — {{ s.name_en }}</option>{% endfor %}
</select></div><div class="fg"><label>القسم الفرعي</label><select name="subsection_id" id="sbs"><option value="">بدون</option></select></div></div>
<div class="fg"><label>صورة الغلاف (رفع من الجهاز) {% if not project %}<span style="color:#e74c3c">*مطلوب</span>{% endif %}</label>
<input type="file" name="cover_file" accept="image/*" {% if not project %}required{% endif %}>
{% if project %}<p style="color:#888;font-size:.8rem;margin-top:5px">الغلاف الحالي: {{ project.cover_image }}</p>{% endif %}
</div>
<div class="fg"><label>ملفات المعرض (صور + فيديوهات - يمكن اختيار عدة ملفات)</label>
<input type="file" name="gallery_files" accept="image/*,video/*" multiple>
<p style="color:#888;font-size:.8rem;margin-top:5px">يمكنك رفع عدة صور وفيديوهات مرة واحدة. الملفات ستظهر بمقاسها الأصلي.</p>
</div>
{% if project and project.images %}
<div class="fg"><label>المعرض الحالي ({{ project.images|length }} ملف)</label>
<div class="gallery-grid">
{% for img in project.images|sort(attribute='order_idx') %}
<div class="gallery-thumb">
{% if img.is_video %}<video src="/static/uploads/{{ img.image_path }}" muted></video>
{% else %}<img src="/static/uploads/{{ img.image_path }}" alt="">{% endif %}
<a href="{{ url_for('admin_gallery_delete',img_id=img.id) }}" class="del-btn" onclick="return confirm('حذف هذا الملف؟')">&times;</a>
</div>
{% endfor %}
</div></div>
{% endif %}
<div class="fr"><div class="fg"><label>رابط فيديو (YouTube/خارجي)</label><input name="video_url" value="{{ project.video_url if project else '' }}"></div>
<div class="fg"><label>رابط الموقع</label><input name="link_url" value="{{ project.link_url if project else '' }}"></div></div>
<div class="fr"><div class="fg"><label>تقنيات (مفصولة بفواصل)</label><input name="tech_tags" value="{{ project.tech_tags if project else '' }}" placeholder="React, Python, ..."></div>
<div class="fg"><label>ترتيب</label><input name="order_idx" type="number" value="{{ project.order_idx if project else 0 }}"></div></div>
<div style="display:flex;gap:10px;margin-top:10px">
<button class="ba" type="submit">{{ 'حفظ التعديلات' if project else 'إضافة المشروع' }}</button>
<a href="{{ url_for('admin_projects') }}" class="ba bo">إلغاء</a>
</div></form></div>
<script>
const ss=document.getElementById('ss'),sbs=document.getElementById('sbs');
const cur={{ project.subsection_id if project and project.subsection_id else 'null' }};
async function loadSubs(){
    const v=ss.value;sbs.innerHTML='<option value="">بدون</option>';if(!v)return;
    const r=await fetch('/api/subsections/'+v);const d=await r.json();
    d.forEach(s=>{const o=document.createElement('option');o.value=s.id;o.textContent=s.name_ar+' — '+s.name_en;if(cur&&s.id===cur)o.selected=true;sbs.appendChild(o)});
}
ss.addEventListener('change',loadSubs);
if(ss.value)loadSubs();
</script>
{% endblock %}''')

# ── TEAM with EDIT ──
print("📦 Writing templates/admin/about.html...")
w('templates/admin/about.html', r'''{% extends "admin/base.html" %}
{% block pt %}إدارة الفريق{% endblock %}
{% block ac %}
<div class="cd"><h3>إضافة عضو</h3>
<form method="POST" action="{{ url_for('admin_team_add') }}" enctype="multipart/form-data">
<div class="fr"><div class="fg"><label>اسم AR</label><input name="name_ar" required></div>
<div class="fg"><label>اسم EN</label><input name="name_en" required></div></div>
<div class="fr"><div class="fg"><label>دور AR</label><input name="role_ar" required></div>
<div class="fg"><label>دور EN</label><input name="role_en" required></div></div>
<div class="fr"><div class="fg"><label>مهارات AR (مفصولة بفواصل)</label><input name="skills_ar"></div>
<div class="fg"><label>مهارات EN (مفصولة بفواصل)</label><input name="skills_en"></div></div>
<div class="fg"><label>صورة (رفع من الجهاز)</label><input type="file" name="image" accept="image/*"></div>
<button class="ba" type="submit">إضافة</button></form></div>
<div class="cd"><h3>أعضاء الفريق ({{ members|length }})</h3>
{% for m in members %}
<div style="border:1px solid rgba(255,255,255,.05);border-radius:10px;padding:20px;margin-bottom:15px">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
<div style="display:flex;align-items:center;gap:15px">
{% if m.image %}<img src="/static/uploads/{{ m.image }}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;border:2px solid #5DCBCA">{% endif %}
<div><strong>{{ m.name_ar }} / {{ m.name_en }}</strong><br><span style="color:#888;font-size:.85rem">{{ m.role_ar }} / {{ m.role_en }}</span></div>
</div>
<div class="actions-cell">
<button class="ba be" style="padding:5px 12px" onclick="document.getElementById('edit-team-{{m.id}}').classList.toggle('show')">تعديل</button>
<a href="{{ url_for('admin_team_delete',tid=m.id) }}" class="ba bd" style="padding:5px 12px" onclick="return confirm('حذف؟')">حذف</a>
</div></div>
<form class="edit-form" id="edit-team-{{m.id}}" method="POST" action="{{ url_for('admin_team_edit',tid=m.id) }}" enctype="multipart/form-data">
<div class="fr"><div class="fg"><label>اسم AR</label><input name="name_ar" value="{{ m.name_ar }}" required></div>
<div class="fg"><label>اسم EN</label><input name="name_en" value="{{ m.name_en }}" required></div></div>
<div class="fr"><div class="fg"><label>دور AR</label><input name="role_ar" value="{{ m.role_ar }}" required></div>
<div class="fg"><label>دور EN</label><input name="role_en" value="{{ m.role_en }}" required></div></div>
<div class="fr"><div class="fg"><label>مهارات AR</label><input name="skills_ar" value="{{ m.skills_ar }}"></div>
<div class="fg"><label>مهارات EN</label><input name="skills_en" value="{{ m.skills_en }}"></div></div>
<div class="fg"><label>صورة جديدة (اختياري)</label><input type="file" name="image" accept="image/*"></div>
<button class="ba" type="submit">حفظ التعديلات</button></form>
</div>{% endfor %}
</div>
{% endblock %}''')

# ── ADMINS (unchanged but reformatted) ──
print("📦 Writing templates/admin/admins.html...")
w('templates/admin/admins.html', r'''{% extends "admin/base.html" %}
{% block pt %}إدارة المشرفين{% endblock %}
{% block ac %}
<div class="cd"><h3>إضافة مشرف</h3>
<form method="POST" action="{{ url_for('admin_admins_add') }}">
<div class="fr"><div class="fg"><label>اسم المستخدم</label><input name="username" required></div>
<div class="fg"><label>كلمة المرور</label><input name="password" type="password" required></div></div>
<div class="fg"><label>الدور</label><select name="role"><option value="admin">مشرف عادي</option><option value="super_admin">سوبر أدمن</option></select></div>
<div class="fg"><label>الصلاحيات</label><div class="pg">
<label class="pc"><input type="checkbox" name="can_manage_projects" checked> المشاريع</label>
<label class="pc"><input type="checkbox" name="can_manage_sections" checked> الأقسام</label>
<label class="pc"><input type="checkbox" name="can_manage_content" checked> المحتوى</label>
<label class="pc"><input type="checkbox" name="can_manage_team"> الفريق</label>
<label class="pc"><input type="checkbox" name="can_manage_logo"> الشعار</label>
<label class="pc"><input type="checkbox" name="can_manage_admins"> المشرفون</label>
</div></div><button class="ba" type="submit">إضافة</button></form></div>
<div class="cd"><h3>المشرفون</h3>
{% for a in admins %}
<div style="border:1px solid rgba(255,255,255,.05);border-radius:10px;padding:20px;margin-bottom:15px">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
<div><strong>{{ a.username }}</strong> <span class="bg {{ 'bg-s' if a.role=='super_admin' else 'bg-a' }}">{{ a.role }}</span></div>
{% if a.id != current_user.id %}<a href="{{ url_for('admin_admins_delete',aid=a.id) }}" class="ba bd" style="padding:5px 12px" onclick="return confirm('حذف؟')">حذف</a>{% endif %}
</div>
{% if a.role != 'super_admin' %}
<form method="POST" action="{{ url_for('admin_admins_update',aid=a.id) }}">
<div class="pg">
<label class="pc"><input type="checkbox" name="can_manage_projects" {{ 'checked' if a.can_manage_projects }}> المشاريع</label>
<label class="pc"><input type="checkbox" name="can_manage_sections" {{ 'checked' if a.can_manage_sections }}> الأقسام</label>
<label class="pc"><input type="checkbox" name="can_manage_content" {{ 'checked' if a.can_manage_content }}> المحتوى</label>
<label class="pc"><input type="checkbox" name="can_manage_team" {{ 'checked' if a.can_manage_team }}> الفريق</label>
<label class="pc"><input type="checkbox" name="can_manage_logo" {{ 'checked' if a.can_manage_logo }}> الشعار</label>
<label class="pc"><input type="checkbox" name="can_manage_admins" {{ 'checked' if a.can_manage_admins }}> المشرفون</label>
</div>
<div class="fg" style="margin-top:10px"><label>كلمة مرور جديدة (اختياري)</label><input type="password" name="new_password" placeholder="اتركه فارغ"></div>
<button class="ba" type="submit" style="margin-top:10px">حفظ</button></form>
{% endif %}</div>{% endfor %}</div>
{% endblock %}''')

# ── SITE CONTENT (unchanged) ──
print("📦 Writing templates/admin/site_content.html...")
w('templates/admin/site_content.html', r'''{% extends "admin/base.html" %}
{% block pt %}إدارة المحتوى{% endblock %}
{% block ac %}
<div class="cd"><form method="POST" action="{{ url_for('admin_content_save') }}">
{% for c in content %}
<div style="border-bottom:1px solid rgba(255,255,255,.05);padding:15px 0">
<h4 style="color:#5DCBCA;margin-bottom:10px">{{ c.key_name }}</h4>
<div class="fr"><div class="fg"><label>عربي</label><textarea name="{{ c.key_name }}_ar">{{ c.text_ar }}</textarea></div>
<div class="fg"><label>English</label><textarea name="{{ c.key_name }}_en">{{ c.text_en }}</textarea></div></div></div>
{% endfor %}
<button class="ba" type="submit" style="margin-top:20px">حفظ الكل</button></form></div>
{% endblock %}''')

# ═══════════════════════════════════════════════════════════
# 6. CSS - Complete with theme fixes, 3D, gallery, lightbox
# ═══════════════════════════════════════════════════════════
print("📦 Writing static/css/main.css...")
w('static/css/main.css', r'''@font-face{font-family:'Co Headline';src:url('../fonts/Co Headline Light.otf') format('opentype');font-weight:300;font-display:swap}
@font-face{font-family:'Co Headline';src:url('../fonts/Co Headline.otf') format('opentype');font-weight:400;font-display:swap}
@font-face{font-family:'Co Headline';src:url('../fonts/Co Headline Bold.otf') format('opentype');font-weight:700;font-display:swap}

:root{--primary:#5DCBCA;--secondary:#126C73;--dark:#07444E;--white:#FFF;--container-width:1200px;--section-pad:100px;--ts:.3s;--te:cubic-bezier(.25,.8,.25,1)}
.theme-dark{--bg:#07444E;--bgg:radial-gradient(circle,#07444E,#000);--tc:#FFF;--tm:#A3D5D5;--cb:rgba(0,0,0,.2);--bc:rgba(93,203,202,.2);--sb:#07444E;--card-bg:rgba(0,0,0,.2);--card-border:rgba(93,203,202,.2);--card-back:linear-gradient(135deg,#07444E,#126C73);--skill-bg:rgba(255,255,255,.2);--skill-color:#fff}
.theme-light{--bg:#F0FAFA;--bgg:radial-gradient(circle,#EFF9F9,#FFF);--tc:#07444E;--tm:#126C73;--cb:#FFF;--bc:rgba(18,108,115,.1);--sb:#EFF9F9;--card-bg:#fff;--card-border:rgba(18,108,115,.15);--card-back:linear-gradient(135deg,#126C73,#5DCBCA);--skill-bg:rgba(255,255,255,.3);--skill-color:#fff}

*{margin:0;padding:0;box-sizing:border-box}html{scroll-behavior:smooth;overflow-x:hidden}
body{font-family:'Co Headline',sans-serif;background:var(--bg);background-image:var(--bgg);color:var(--tc);transition:background var(--ts) var(--te),color var(--ts) var(--te);cursor:none;overflow-x:hidden;min-height:100vh}
a{text-decoration:none;color:inherit;cursor:none}button{font-family:inherit;cursor:none;border:none;outline:none;background:none}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:var(--sb)}::-webkit-scrollbar-thumb{background:var(--primary);border-radius:10px}

/* Cursor */
#custom-cursor{position:fixed;top:0;left:0;width:12px;height:12px;background:var(--primary);border-radius:50%;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);transition:width .2s,height .2s;mix-blend-mode:difference;display:flex;align-items:center;justify-content:center}
.cursor-text{display:none;font-size:10px;font-weight:700;color:#000}
#cursor-trail{position:fixed;top:0;left:0;width:30px;height:30px;border:1px solid rgba(93,203,202,.5);border-radius:50%;pointer-events:none;z-index:9998;transform:translate(-50%,-50%);transition:width .2s,height .2s}
body.hovering #custom-cursor{width:40px;height:40px;background:rgba(93,203,202,.2);mix-blend-mode:normal}
body.hovering #cursor-trail{border-color:transparent}
body.project-hover #custom-cursor{width:80px;height:80px;background:var(--primary);mix-blend-mode:normal}
body.project-hover #custom-cursor .cursor-text{display:block}
body.project-hover #cursor-trail{opacity:0}

/* Preloader */
#preloader{position:fixed;top:0;left:0;width:100%;height:100%;background:var(--bg);z-index:10000;display:flex;justify-content:center;align-items:center}
.stroke-draw{stroke-dasharray:400;stroke-dashoffset:400;animation:drawStroke 2s ease forwards;fill:transparent}
@keyframes drawStroke{0%{stroke-dashoffset:400;fill:transparent}70%{stroke-dashoffset:0;fill:transparent}100%{stroke-dashoffset:0;fill:var(--primary)}}

/* Nav */
.floating-nav{position:fixed;top:20px;left:50%;transform:translateX(-50%);display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.02);backdrop-filter:blur(15px);border:1px solid rgba(93,203,202,.2);padding:10px 30px;border-radius:50px;z-index:1000;width:90%;max-width:1000px;transition:.3s}
.theme-light .floating-nav{background:rgba(0,0,0,.03);border-color:rgba(18,108,115,.1)}
.nav-logo{display:flex;align-items:center}.nav-logo-img{height:35px;width:auto;object-fit:contain;transition:.3s}
.theme-dark .nav-logo-img{filter:brightness(0) invert(1)}.theme-light .nav-logo-img{filter:none}
.nav-links{display:flex;gap:30px}.nav-links a{font-size:1.1rem;position:relative;color:var(--tc);font-weight:300;transition:.3s}
.nav-links a::after{content:'';position:absolute;bottom:-5px;left:50%;width:0;height:2px;background:var(--primary);transition:.3s;transform:translateX(-50%)}
.nav-links a:hover{color:var(--primary)}.nav-links a:hover::after{width:100%}
.nav-controls{display:flex;gap:10px}
.nav-btn{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.05);color:var(--tc);display:flex;align-items:center;justify-content:center;border:1px solid var(--bc);font-weight:bold;transition:.3s}
.theme-light .nav-btn{background:rgba(0,0,0,.05)}.nav-btn:hover{background:var(--primary);color:#000;transform:scale(1.05)}.nav-btn svg{width:18px;height:18px}

.container{max-width:var(--container-width);margin:0 auto;padding:0 20px}
section{padding:var(--section-pad) 0;position:relative;z-index:2}

/* Hero */
.hero{height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:100px 0 0;overflow:hidden;position:relative}
#three-canvas-container{position:absolute;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none}
.hero-logo-container{perspective:1000px;z-index:2;margin-bottom:30px;display:flex;justify-content:center;align-items:center}
.hero-main-logo{width:clamp(200px,25vw,350px);transition:transform .5s cubic-bezier(.2,.8,.2,1);transform-style:preserve-3d}
.theme-dark .hero-main-logo{animation:logoEntrance 1.5s cubic-bezier(.2,.8,.2,1) forwards,majesticFloat 6s ease-in-out infinite 1.5s}
.theme-light .hero-main-logo{animation:logoEntrance 1.5s cubic-bezier(.2,.8,.2,1) forwards,majesticFloatL 6s ease-in-out infinite 1.5s}
@keyframes logoEntrance{0%{transform:scale(0) translateY(100px) rotate(-15deg);opacity:0;filter:blur(20px)}60%{transform:scale(1.1) translateY(-10px) rotate(5deg);opacity:1;filter:blur(0)}100%{transform:scale(1) translateY(0) rotate(-2deg);opacity:1}}
@keyframes majesticFloat{0%,100%{transform:translateY(0) rotate(-2deg);filter:brightness(0) invert(1) drop-shadow(0 15px 25px rgba(255,255,255,.25))}50%{transform:translateY(-20px) rotate(2deg) scale(1.05);filter:brightness(0) invert(1) drop-shadow(0 30px 45px rgba(255,255,255,.4))}}
@keyframes majesticFloatL{0%,100%{transform:translateY(0) rotate(-2deg);filter:drop-shadow(0 15px 25px rgba(18,108,115,.2))}50%{transform:translateY(-20px) rotate(2deg) scale(1.05);filter:drop-shadow(0 30px 45px rgba(18,108,115,.4))}}

.hero-content{max-width:800px;z-index:2;padding:0 20px}
.hero-title{font-size:clamp(1.8rem,5vw,4rem);font-weight:700;margin-bottom:20px;line-height:1.6}
.hero-subtitle{font-size:clamp(1.2rem,2vw,1.8rem);font-weight:300;color:var(--tm);margin-bottom:40px;letter-spacing:2px}
.hero-cta{display:flex;gap:20px;justify-content:center;flex-wrap:wrap}
.btn{padding:15px 40px;border-radius:30px;font-size:1.1rem;font-weight:700;transition:all .3s cubic-bezier(.175,.885,.32,1.275);display:inline-flex;align-items:center;justify-content:center;border:2px solid var(--primary)}
.btn-primary{background:var(--primary);color:#000}.btn-primary:hover{box-shadow:0 0 25px rgba(93,203,202,.6);transform:translateY(-5px) scale(1.05)}
.btn-outline{background:transparent;color:var(--tc)}.btn-outline:hover{background:rgba(93,203,202,.1);transform:translateY(-5px) scale(1.05)}
.scroll-indicator{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);animation:bounce 2s infinite;opacity:.7}
@keyframes bounce{0%,20%,50%,80%,100%{transform:translateY(0) translateX(-50%)}40%{transform:translateY(-20px) translateX(-50%)}60%{transform:translateY(-10px) translateX(-50%)}}

.section-header{text-align:center;margin-bottom:60px}.section-title{font-size:3rem;font-weight:700;color:var(--primary);margin-bottom:15px}

/* About */
.about-grid{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
@media(max-width:900px){.about-grid{grid-template-columns:1fr}}
.about-text h3{font-size:2.5rem;margin-bottom:25px;line-height:1.3}
.about-text p{font-size:1.2rem;color:var(--tm);margin-bottom:30px;line-height:1.8}
.about-features{list-style:none}.about-features li{display:flex;align-items:center;gap:10px;margin-bottom:15px;font-size:1.1rem}
.about-features li::before{content:'•';color:var(--primary);font-size:1.5rem}

/* TEAM - Theme-aware cards */
.team-grid{display:grid;grid-template-columns:1fr 1fr;gap:30px}
.team-member{perspective:1000px;height:250px}
.team-card-inner{position:relative;width:100%;height:100%;text-align:center;transition:transform .8s cubic-bezier(.2,.8,.2,1);transform-style:preserve-3d}
.team-member:hover .team-card-inner{transform:rotateY(180deg)}
.team-front,.team-back{position:absolute;width:100%;height:100%;backface-visibility:hidden;border-radius:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;transition:background var(--ts) var(--te),border-color var(--ts) var(--te),box-shadow var(--ts) var(--te)}
.team-front{background:var(--card-bg);border:1px solid var(--card-border);box-shadow:0 10px 30px rgba(0,0,0,.1)}
.team-member:hover .team-front{border-color:var(--primary);box-shadow:0 0 20px rgba(93,203,202,.3)}
.team-back{transform:rotateY(180deg);background:var(--card-back);color:#fff;border:1px solid var(--primary)}
.team-img-wrap{width:100px;height:100px;border-radius:50%;overflow:hidden;margin-bottom:15px;border:3px solid var(--primary)}
.team-img-wrap img{width:100%;height:100%;object-fit:cover}
.team-name{font-size:1.3rem;font-weight:700;margin-bottom:5px;color:var(--tc)}
.team-back .team-name{color:#fff}
.team-role{color:var(--primary);font-size:.9rem;font-weight:300;text-transform:uppercase;letter-spacing:1px}
.team-skills{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.skill-tag{background:var(--skill-bg);color:var(--skill-color);padding:5px 12px;border-radius:15px;font-size:.85rem;transition:background var(--ts),color var(--ts)}

/* Portfolio Tabs */
.portfolio-tabs{display:flex;justify-content:center;gap:20px;margin-bottom:40px;flex-wrap:wrap}
.tab-btn{padding:15px 35px;border-radius:40px;background:transparent;border:1px solid var(--bc);color:var(--tc);font-weight:700;transition:all .4s cubic-bezier(.2,.8,.2,1);font-size:1.1rem;position:relative;overflow:hidden}
.tab-btn::before{content:'';position:absolute;top:0;left:0;width:100%;height:100%;background:var(--primary);transform:scaleY(0);transition:.4s cubic-bezier(.2,.8,.2,1);z-index:-1;transform-origin:bottom}
.tab-btn.active,.tab-btn:hover{color:#000;border-color:var(--primary);transform:translateY(-5px);box-shadow:0 10px 20px rgba(93,203,202,.2)}
.tab-btn.active::before,.tab-btn:hover::before{transform:scaleY(1)}

.portfolio-subcategories{display:flex;justify-content:center;gap:30px;margin-bottom:60px;flex-wrap:wrap}
.sub-tab{font-size:1.1rem;color:var(--tm);position:relative;padding:5px 0;transition:.3s;font-weight:300;letter-spacing:1px}
.sub-tab::after{content:'';position:absolute;bottom:0;left:50%;width:0;height:2px;background:var(--primary);transition:.3s;transform:translateX(-50%)}
.sub-tab.active,.sub-tab:hover{color:var(--primary);font-weight:700}
.sub-tab.active::after,.sub-tab:hover::after{width:100%}

/* Projects Grid */
.projects-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:30px;align-items:start}
@media(max-width:600px){.projects-grid{grid-template-columns:1fr}}
.project-card{position:relative;border-radius:20px;overflow:hidden;background:#000;box-shadow:0 15px 35px rgba(0,0,0,.3);transition:transform .6s cubic-bezier(.2,.8,.2,1),box-shadow .6s;aspect-ratio:16/9;display:block}
.project-card img{width:100%;height:100%;object-fit:cover;transition:transform .8s cubic-bezier(.2,.8,.2,1);filter:brightness(.8)}
.project-overlay{position:absolute;bottom:0;left:0;width:100%;height:60%;background:linear-gradient(to top,rgba(0,0,0,.9),transparent);display:flex;flex-direction:column;justify-content:flex-end;align-items:flex-start;padding:40px;color:#fff;opacity:0;transition:opacity .4s}
html[dir="rtl"] .project-overlay{align-items:flex-end;text-align:right}
html[dir="ltr"] .project-overlay{align-items:flex-start;text-align:left}
.project-card:hover{transform:translateY(-10px) scale(1.02);box-shadow:0 25px 50px rgba(93,203,202,.25);z-index:10}
.project-card:hover img{transform:scale(1.1);filter:brightness(.5)}.project-card:hover .project-overlay{opacity:1}
.project-title{font-size:2rem;font-weight:700;transform:translateY(30px);transition:transform .5s .1s cubic-bezier(.2,.8,.2,1);margin-bottom:5px;color:var(--primary)}
.project-card:hover .project-title{transform:translateY(0)}
.project-cat{font-size:1rem;letter-spacing:2px;text-transform:uppercase;transform:translateY(30px);transition:transform .5s .2s cubic-bezier(.2,.8,.2,1);opacity:.7}
.project-card:hover .project-cat{transform:translateY(0)}

/* Contact */
.contact-section{position:relative;text-align:center;padding:120px 0;overflow:hidden;margin-top:100px}
.contact-bg{position:absolute;top:0;left:0;width:100%;height:100%;background:url('../images/لوغو نيتبال جديد-0١.png') center/500px no-repeat;opacity:.05;z-index:-1;animation:floatLogo 10s ease-in-out infinite}
@keyframes floatLogo{0%,100%{transform:translateY(0)}50%{transform:translateY(-30px)}}
.contact-actions{display:flex;justify-content:center;gap:50px;margin-top:60px;flex-wrap:wrap;perspective:1000px}
.contact-btn{width:300px;height:260px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.1);backdrop-filter:blur(20px);border-radius:30px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;font-size:1.8rem;font-weight:700;transition:transform .1s;position:relative;overflow:hidden;transform-style:preserve-3d}
.theme-light .contact-btn{background:rgba(0,0,0,.05);border-color:rgba(0,0,0,.1)}
.contact-btn svg{width:70px;height:70px;color:var(--primary);transform:translateZ(50px);transition:.4s}
.contact-btn span{transform:translateZ(30px);letter-spacing:1px}
.contact-btn:hover{border-color:var(--primary);box-shadow:0 25px 60px rgba(93,203,202,.15)}
.contact-btn:hover svg{color:var(--tc);filter:drop-shadow(0 0 10px var(--primary))}
.contact-btn::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(93,203,202,.2),transparent 60%);opacity:0;transition:.5s;pointer-events:none}
.contact-btn:hover::before{opacity:1}

/* Footer */
.site-footer{border-top:1px solid var(--bc);padding:30px 0;display:flex;justify-content:center;align-items:center}
.footer-content{display:flex;justify-content:space-between;align-items:center;width:100%;gap:20px;flex-wrap:wrap}
.footer-logo{width:80px;transition:.4s}.theme-dark .footer-logo{filter:brightness(0) invert(1)}
.footer-logo:hover{transform:scale(1.1) rotate(5deg);filter:drop-shadow(0 0 10px var(--primary))}
.footer-madeby{font-size:.9rem;color:var(--tm);opacity:.8;letter-spacing:1px;font-weight:300}

/* ═══ PROJECT DETAIL PAGE ═══ */
.project-detail-page{padding-top:120px;min-height:100vh}
.breadcrumb{display:flex;gap:10px;align-items:center;margin-bottom:30px;color:var(--tm);font-size:.95rem;flex-wrap:wrap}
.breadcrumb a{color:var(--primary)}.breadcrumb .sep{opacity:.3}
.pd-header{margin-bottom:40px}.pd-title{font-size:clamp(2rem,4vw,3.5rem);color:var(--primary);margin-bottom:15px;line-height:1.3}
.pd-tags{display:flex;gap:10px;flex-wrap:wrap}
.pd-cover{border-radius:20px;overflow:hidden;margin-bottom:40px}
.pd-cover img{width:100%;display:block}
.pd-body{margin-bottom:40px}.pd-desc{font-size:1.2rem;line-height:2;color:var(--tm);margin-bottom:20px}.pd-link{margin-top:10px}
.pd-section-title{font-size:1.8rem;color:var(--primary);margin-bottom:20px;font-weight:700}

/* Video */
.pd-video{margin-bottom:40px;border-radius:20px;overflow:hidden}
.video-wrapper{position:relative;padding-bottom:56.25%;height:0;background:#000;border-radius:20px;overflow:hidden}
.video-wrapper iframe,.video-wrapper video{position:absolute;top:0;left:0;width:100%;height:100%;border:none}

/* Gallery - ORIGINAL SIZE images */
.pd-gallery-section{margin-bottom:40px}
.pd-gallery{display:flex;flex-direction:column;gap:25px;align-items:center}
.gallery-item{border-radius:16px;overflow:hidden;border:1px solid var(--bc);transition:transform .4s,box-shadow .4s;max-width:100%}
.gallery-item:hover{transform:scale(1.02);box-shadow:0 15px 40px rgba(93,203,202,.2)}
.gallery-item img{display:block;max-width:100%;height:auto}
.gallery-video{max-width:100%}
.gallery-video video{display:block;max-width:100%;height:auto;border-radius:16px}
.pd-back{text-align:center;margin-top:40px;padding-bottom:40px}

/* Lightbox */
.lightbox-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.95);z-index:10001;display:flex;align-items:center;justify-content:center}
.lb-content{max-width:95vw;max-height:90vh;display:flex;align-items:center;justify-content:center}
.lb-content img{max-width:95vw;max-height:90vh;object-fit:contain;border-radius:10px}
.lb-close{position:fixed;top:20px;right:20px;background:none;border:none;color:#fff;font-size:40px;cursor:pointer;z-index:10002;width:50px;height:50px;display:flex;align-items:center;justify-content:center;transition:.3s}
.lb-close:hover{color:var(--primary);transform:rotate(90deg)}
.lb-prev,.lb-next{position:fixed;top:50%;background:none;border:none;color:#fff;font-size:30px;cursor:pointer;z-index:10002;padding:20px;transition:.3s}
.lb-prev{left:10px;transform:translateY(-50%)}.lb-next{right:10px;transform:translateY(-50%)}
.lb-prev:hover,.lb-next:hover{color:var(--primary)}

/* 3D Floating effect for sections */
.section-3d{transform-style:preserve-3d;perspective:1000px}
.float-3d{animation:float3d 6s ease-in-out infinite}
@keyframes float3d{0%,100%{transform:translateY(0) rotateX(0) rotateY(0)}25%{transform:translateY(-8px) rotateX(1deg) rotateY(-1deg)}50%{transform:translateY(-15px) rotateX(0) rotateY(1deg)}75%{transform:translateY(-8px) rotateX(-1deg) rotateY(0)}}

/* Parallax depth layers */
.parallax-element{transition:transform .3s ease-out}

.hidden{display:none!important}
@media(max-width:768px){.floating-nav{padding:8px 15px}.nav-links{display:none}.team-grid{grid-template-columns:1fr}.contact-actions{gap:20px}.contact-btn{width:100%;max-width:350px;height:200px}}
''')

# ═══════════════════════════════════════════════════════════
# 7. JS - Complete with 3D effects throughout, translations fix
# ═══════════════════════════════════════════════════════════
print("📦 Writing static/js/app.js...")
w('static/js/app.js', r'''const state={lang:'ar',theme:'dark'};
const langBtn=document.getElementById('lang-toggle'),themeBtn=document.getElementById('theme-toggle');
const rootHtml=document.documentElement,body=document.body;

document.addEventListener('DOMContentLoaded',()=>{
    initPreloader();initTheme();initLang();initCursor();initThreeJS();
    initGSAP();initPortfolio();init3DEffects();
});

/* ═══ PRELOADER ═══ */
function initPreloader(){
    setTimeout(()=>{
        gsap.to('#preloader',{opacity:0,duration:1,onComplete:()=>{
            document.getElementById('preloader').style.display='none';
            animateHero();
        }});
    },2500);
}

/* ═══ CURSOR ═══ */
function initCursor(){
    const c=document.getElementById('custom-cursor'),t=document.getElementById('cursor-trail');
    if(!c||!t||('ontouchstart' in window))return;
    window.addEventListener('mousemove',e=>{
        gsap.to(c,{x:e.clientX,y:e.clientY,duration:0});
        gsap.to(t,{x:e.clientX,y:e.clientY,duration:.15,ease:'power2.out'});
    });
    document.querySelectorAll('a,button,.project-card,.team-member,.contact-btn,.btn,.tab-btn,.sub-tab').forEach(el=>{
        el.addEventListener('mouseenter',()=>body.classList.add('hovering'));
        el.addEventListener('mouseleave',()=>body.classList.remove('hovering'));
    });
}

/* ═══ THEME ═══ */
function initTheme(){
    const im=document.querySelector('.icon-moon'),is=document.querySelector('.icon-sun');
    if(!themeBtn)return;
    themeBtn.addEventListener('click',()=>{
        if(state.theme==='dark'){
            body.classList.replace('theme-dark','theme-light');
            if(im)im.classList.add('hidden');if(is)is.classList.remove('hidden');
            state.theme='light';
        }else{
            body.classList.replace('theme-light','theme-dark');
            if(is)is.classList.add('hidden');if(im)im.classList.remove('hidden');
            state.theme='dark';
        }
        updateThreeJSColor();
    });
}

/* ═══ LANGUAGE ═══ */
function initLang(){
    if(!langBtn)return;
    langBtn.addEventListener('click',()=>{
        state.lang=state.lang==='ar'?'en':'ar';
        langBtn.textContent=state.lang==='ar'?'EN':'عربي';
        rootHtml.setAttribute('dir',state.lang==='ar'?'rtl':'ltr');
        rootHtml.setAttribute('lang',state.lang);
        updateContent();
    });
    updateContent();
}

function updateContent(){
    // data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(el=>{
        const k=el.getAttribute('data-i18n');
        if(window.SITE_CONTENT && window.SITE_CONTENT[k]){
            let h=window.SITE_CONTENT[k][state.lang]||'';
            h=h.replace(/NetPal/g,'<span dir="ltr" style="display:inline-block">NetPal</span>');
            el.innerHTML=h;
        }
    });
    // data-ar/data-en elements
    document.querySelectorAll('[data-ar][data-en]').forEach(el=>{
        el.textContent=el.getAttribute('data-'+state.lang);
    });
    // Dynamic renders
    renderTeam();
    renderProjects();
}

/* ═══ TEAM ═══ */
function renderTeam(){
    const c=document.getElementById('team-container');
    if(!c||!window.TEAM_DATA)return;
    c.innerHTML='';
    window.TEAM_DATA.forEach(t=>{
        const n=state.lang==='ar'?t.name_ar:t.name_en;
        const r=state.lang==='ar'?t.role_ar:t.role_en;
        const s=state.lang==='ar'?t.skills_ar:t.skills_en;
        const img=t.image?`/static/uploads/${t.image}`:`/static/images/لوغو نيتبال جديد-0١.png`;
        const div=document.createElement('div');
        div.className='team-member';
        div.innerHTML=`<div class="team-card-inner">
            <div class="team-front">
                <div class="team-img-wrap"><img src="${img}" alt="${n}"></div>
                <div class="team-name">${n}</div>
                <div class="team-role">${r}</div>
            </div>
            <div class="team-back">
                <div class="team-name" style="margin-bottom:15px;color:#fff">${n}</div>
                <div class="team-skills">${s.map(x=>`<span class="skill-tag">${x.trim()}</span>`).join('')}</div>
            </div>
        </div>`;
        c.appendChild(div);
    });
    // Re-init cursor hover on new elements
    initCursor();
    // Animate team cards
    if(typeof gsap!=='undefined'){
        gsap.from('.team-member',{y:50,opacity:0,duration:.8,stagger:.15,ease:'back.out(1.7)',
            scrollTrigger:{trigger:'.team-grid',start:'top 85%'}});
    }
}

/* ═══ PORTFOLIO ═══ */
let curSecId=null,curSubId=null;

function initPortfolio(){
    const tc=document.getElementById('section-tabs'),sc=document.getElementById('sub-tabs');
    if(!tc||!window.SECTIONS_DATA||!window.SECTIONS_DATA.length)return;
    window.SECTIONS_DATA.forEach((sec,i)=>{
        const b=document.createElement('button');
        b.className='tab-btn'+(i===0?' active':'');
        b.textContent=state.lang==='ar'?sec.name_ar:sec.name_en;
        b.dataset.secId=sec.id;
        b.dataset.nameAr=sec.name_ar;
        b.dataset.nameEn=sec.name_en;
        b.addEventListener('click',()=>{
            document.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active'));
            b.classList.add('active');
            curSecId=sec.id;
            buildSubTabs(sec);
        });
        tc.appendChild(b);
    });
    curSecId=window.SECTIONS_DATA[0].id;
    buildSubTabs(window.SECTIONS_DATA[0]);
}

function buildSubTabs(sec){
    const sc=document.getElementById('sub-tabs');
    if(!sc)return;
    sc.innerHTML='';
    if(sec.subsections&&sec.subsections.length){
        const ab=document.createElement('button');
        ab.className='sub-tab active';
        ab.textContent=state.lang==='ar'?'الكل':'All';
        ab.dataset.subId='';
        ab.addEventListener('click',()=>{
            document.querySelectorAll('.sub-tab').forEach(x=>x.classList.remove('active'));
            ab.classList.add('active');curSubId=null;renderProjects();
        });
        sc.appendChild(ab);
        sec.subsections.forEach(sub=>{
            const b=document.createElement('button');
            b.className='sub-tab';
            b.textContent=state.lang==='ar'?sub.name_ar:sub.name_en;
            b.dataset.subId=sub.id;
            b.dataset.nameAr=sub.name_ar;
            b.dataset.nameEn=sub.name_en;
            b.addEventListener('click',()=>{
                document.querySelectorAll('.sub-tab').forEach(x=>x.classList.remove('active'));
                b.classList.add('active');curSubId=sub.id;renderProjects();
            });
            sc.appendChild(b);
        });
        sc.style.display='flex';
    }else{sc.style.display='none'}
    curSubId=null;
    renderProjects();
}

function renderProjects(){
    const c=document.getElementById('projects-container');
    if(!c||!window.PROJECTS_DATA)return;
    c.innerHTML='';
    // Update tab text for current language
    document.querySelectorAll('.tab-btn[data-name-ar]').forEach(b=>{
        b.textContent=state.lang==='ar'?b.dataset.nameAr:b.dataset.nameEn;
    });
    document.querySelectorAll('.sub-tab[data-name-ar]').forEach(b=>{
        b.textContent=state.lang==='ar'?b.dataset.nameAr:b.dataset.nameEn;
    });
    document.querySelectorAll('.sub-tab[data-sub-id=""]').forEach(b=>{
        b.textContent=state.lang==='ar'?'الكل':'All';
    });
    const f=window.PROJECTS_DATA.filter(p=>{
        if(p.section_id!==curSecId)return false;
        if(curSubId&&p.subsection_id!==curSubId)return false;
        return true;
    });
    if(!f.length){
        c.innerHTML=`<p style="grid-column:1/-1;text-align:center;color:var(--tm);opacity:.5;padding:60px 0">${state.lang==='ar'?'لا توجد مشاريع بعد':'No projects yet'}</p>`;
        return;
    }
    f.forEach(p=>{
        const t=state.lang==='ar'?p.title_ar:p.title_en;
        const a=document.createElement('a');
        a.className='project-card';
        a.href=`/project/${p.id}`;
        const coverSrc=p.cover.startsWith('http')?p.cover:`/static/uploads/${p.cover}`;
        a.innerHTML=`<img src="${coverSrc}" alt="${t}"><div class="project-overlay"><div class="project-title">${t}</div></div>`;
        a.addEventListener('mouseenter',()=>{
            body.classList.add('project-hover');
            const ct=document.querySelector('.cursor-text');
            if(ct)ct.textContent=state.lang==='ar'?'عرض':'VIEW';
        });
        a.addEventListener('mouseleave',()=>body.classList.remove('project-hover'));
        c.appendChild(a);
    });
    // Animate project cards
    gsap.from('.project-card',{y:40,opacity:0,duration:.8,stagger:.08,ease:'power3.out'});
    initCursor();
}

/* ═══ THREE.JS ═══ */
let scene,camera,renderer,particles,infinityGroup;
function initThreeJS(){
    const con=document.getElementById('three-canvas-container');
    if(!con)return;
    scene=new THREE.Scene();
    camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,1,3000);
    camera.position.z=1200;
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    renderer.setSize(innerWidth,innerHeight);
    con.appendChild(renderer.domElement);

    // Particles
    const geo=new THREE.BufferGeometry(),v=[];
    for(let i=0;i<5000;i++)v.push((Math.random()-.5)*3000,(Math.random()-.5)*3000,(Math.random()-.5)*3000);
    geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));
    const col=state.theme==='dark'?0x5DCBCA:0x07444E;
    const cv=document.createElement('canvas');cv.width=32;cv.height=32;
    const cx=cv.getContext('2d');
    const gr=cx.createRadialGradient(16,16,0,16,16,16);
    gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.2,'rgba(255,255,255,.8)');
    gr.addColorStop(.5,'rgba(255,255,255,.2)');gr.addColorStop(1,'rgba(255,255,255,0)');
    cx.fillStyle=gr;cx.fillRect(0,0,32,32);
    const tex=new THREE.CanvasTexture(cv);
    particles=new THREE.Points(geo,new THREE.PointsMaterial({
        size:15,color:col,map:tex,blending:THREE.AdditiveBlending,
        depthWrite:false,transparent:true,opacity:.4
    }));
    scene.add(particles);

    // Infinity shape
    infinityGroup=new THREE.Group();
    const ip=[];
    for(let i=0;i<=200;i++){
        const t=i/200*Math.PI*2;
        const x=(800*Math.cos(t))/(1+Math.sin(t)**2);
        const y=(800*Math.sin(t)*Math.cos(t))/(1+Math.sin(t)**2);
        ip.push(new THREE.Vector3(x,y,0));
    }
    const ig=new THREE.BufferGeometry().setFromPoints(ip);
    const im=new THREE.LineBasicMaterial({color:col,transparent:true,opacity:.15});
    for(let j=0;j<5;j++){
        const l=new THREE.Line(ig,im);
        l.scale.setScalar(1-j*.05);
        l.rotation.z=Math.PI/180*j*2;
        infinityGroup.add(l);
    }
    scene.add(infinityGroup);

    let mx=0,my=0,tx=0,ty=0;
    const hx=innerWidth/2,hy=innerHeight/2;
    document.addEventListener('mousemove',e=>{tx=(e.clientX-hx)*.5;ty=(e.clientY-hy)*.5});
    window.addEventListener('resize',()=>{
        camera.aspect=innerWidth/innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth,innerHeight);
    });
    const clock=new THREE.Clock();
    (function ani(){
        requestAnimationFrame(ani);
        const t=clock.getElapsedTime()*.1;
        mx+=(tx-mx)*.05;my+=(ty-my)*.05;
        camera.position.x+=(mx-camera.position.x)*.02;
        camera.position.y+=(-my-camera.position.y)*.02;
        camera.lookAt(scene.position);
        particles.rotation.x=t*.5;particles.rotation.y=t*.7;
        infinityGroup.rotation.x=Math.sin(t)*.5;
        infinityGroup.rotation.y=Math.cos(t*.8)*.5;
        infinityGroup.rotation.z=t*.2;
        renderer.render(scene,camera);
    })();
}

function updateThreeJSColor(){
    if(!particles||!infinityGroup)return;
    const c=state.theme==='dark'?0x5DCBCA:0x07444E;
    const tc=new THREE.Color(c);
    gsap.to(particles.material.color,{r:tc.r,g:tc.g,b:tc.b,duration:1});
    infinityGroup.children.forEach(ch=>{
        gsap.to(ch.material.color,{r:tc.r,g:tc.g,b:tc.b,duration:1});
    });
}

/* ═══ HERO ANIMATION ═══ */
function animateHero(){
    const tl=gsap.timeline();
    tl.from('.hero-main-logo',{scale:0,rotation:180,opacity:0,duration:1.5,ease:'back.out(1.5)'})
    .from('.hero-title',{y:50,opacity:0,duration:1,ease:'power4.out'},'-=.8')
    .from('.hero-subtitle',{y:20,opacity:0,duration:.8},'-=.5')
    .from('.hero-cta .btn',{y:20,opacity:0,duration:.8,stagger:.1},'-=.5')
    .from('.scroll-indicator',{opacity:0,duration:1},'-=.5');
}

/* ═══ GSAP + 3D SCROLL EFFECTS (THROUGHOUT) ═══ */
function initGSAP(){
    gsap.registerPlugin(ScrollTrigger);

    // Section titles - slide in wit…