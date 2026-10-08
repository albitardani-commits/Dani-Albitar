import os
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
ALLOWED_EXT = {'png','jpg','jpeg','gif','svg','webp','mp4','webm','mov','avi'}
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'admin_login'

def allowed_file(fn):
    return '.' in fn and fn.rsplit('.',1)[1].lower() in ALLOWED_EXT

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
                    'images':[i.image_path for i in sorted(p.images, key=lambda x:x.order_idx)]})
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
    if not p: abort(404)
    sec = db.session.get(Section, p.section_id)
    sub = db.session.get(SubSection, p.subsection_id) if p.subsection_id else None
    imgs = [i.image_path for i in sorted(p.images, key=lambda x:x.order_idx)]
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
    db.session.commit(); flash('تم إضافة القسم','success')
    return redirect(url_for('admin_sections'))

@app.route('/admin/sections/edit/<int:sid>', methods=['POST'])
@perm_required('can_manage_sections')
def admin_section_edit(sid):
    s = db.session.get(Section, sid)
    if not s: abort(404)
    s.name_ar = request.form['name_ar']
    s.name_en = request.form['name_en']
    s.slug = request.form['slug']
    s.icon = request.form.get('icon', 'folder')
    s.order_idx = int(request.form.get('order_idx', 0))
    db.session.commit(); flash('تم تعديل القسم','success')
    return redirect(url_for('admin_sections'))

@app.route('/admin/sections/delete/<int:sid>')
@perm_required('can_manage_sections')
def admin_section_delete(sid):
    s = db.session.get(Section, sid)
    if s: db.session.delete(s); db.session.commit(); flash('تم حذف القسم','success')
    return redirect(url_for('admin_sections'))

# ── SubSections ─────────────────────────────────────────────
@app.route('/admin/subsections/<int:section_id>')
@perm_required('can_manage_sections')
def admin_subsections(section_id):
    sec = db.session.get(Section, section_id)
    if not sec: abort(404)
    return render_template('admin/subsections.html', section=sec)

@app.route('/admin/subsections/<int:section_id>/add', methods=['POST'])
@perm_required('can_manage_sections')
def admin_subsection_add(section_id):
    db.session.add(SubSection(section_id=section_id,name_ar=request.form['name_ar'],
        name_en=request.form['name_en'],slug=request.form['slug'],
        order_idx=int(request.form.get('order_idx',0))))
    db.session.commit(); flash('تم إضافة القسم الفرعي','success')
    return redirect(url_for('admin_subsections', section_id=section_id))

@app.route('/admin/subsections/edit/<int:sub_id>', methods=['POST'])
@perm_required('can_manage_sections')
def admin_subsection_edit(sub_id):
    sub = db.session.get(SubSection, sub_id)
    if not sub: abort(404)
    sub.name_ar = request.form['name_ar']
    sub.name_en = request.form['name_en']
    sub.slug = request.form['slug']
    sub.order_idx = int(request.form.get('order_idx', 0))
    db.session.commit(); flash('تم تعديل القسم الفرعي','success')
    return redirect(url_for('admin_subsections', section_id=sub.section_id))

@app.route('/admin/subsections/delete/<int:sub_id>')
@perm_required('can_manage_sections')
def admin_subsection_delete(sub_id):
    sub = db.session.get(SubSection, sub_id)
    if sub:
        sid = sub.section_id; db.session.delete(sub); db.session.commit()
        flash('تم الحذف','success'); return redirect(url_for('admin_subsections', section_id=sid))
    return redirect(url_for('admin_sections'))

# ── Projects CRUD ───────────────────────────────────────────
@app.route('/admin/projects')
@app.route('/admin/projects/section/<int:section_id>')
@perm_required('can_manage_projects')
def admin_projects(section_id=None):
    secs = Section.query.order_by(Section.order_idx).all()
    if section_id:
        projects = Project.query.filter_by(section_id=section_id).order_by(Project.order_idx).all()
    else:
        projects = Project.query.order_by(Project.order_idx).all()
    return render_template('admin/projects.html', projects=projects, sections=secs, current_section=section_id)

@app.route('/admin/projects/add', methods=['GET','POST'])
@perm_required('can_manage_projects')
def admin_project_add():
    secs = Section.query.order_by(Section.order_idx).all()
    if request.method == 'POST':
        cover = ''
        if 'cover_file' in request.files and request.files['cover_file'].filename:
            f = request.files['cover_file']
            if allowed_file(f.filename):
                fn = secure_filename(f.filename)
                f.save(os.path.join(app.config['UPLOAD_FOLDER'],fn))
                cover = fn
        if not cover:
            cover = request.form.get('cover_url','')
        p = Project(title_ar=request.form['title_ar'],title_en=request.form['title_en'],
            description_ar=request.form.get('description_ar',''),description_en=request.form.get('description_en',''),
            section_id=int(request.form['section_id']),
            subsection_id=int(request.form['subsection_id']) if request.form.get('subsection_id') else None,
            cover_image=cover,video_url=request.form.get('video_url',''),
            link_url=request.form.get('link_url',''),tech_tags=request.form.get('tech_tags',''),
            order_idx=int(request.form.get('order_idx',0)))
        db.session.add(p); db.session.commit()
        # Handle multiple project images
        files = request.files.getlist('project_images')
        for idx, fi in enumerate(files):
            if fi.filename and allowed_file(fi.filename):
                fn = secure_filename(fi.filename)
                fi.save(os.path.join(app.config['UPLOAD_FOLDER'], fn))
                db.session.add(ProjectImage(project_id=p.id, image_path=fn, order_idx=idx))
        db.session.commit()
        flash('تم إضافة المشروع','success')
        return redirect(url_for('admin_projects'))
    return render_template('admin/project_form.html', project=None, sections=secs)

@app.route('/admin/projects/edit/<int:pid>', methods=['GET','POST'])
@perm_required('can_manage_projects')
def admin_project_edit(pid):
    p = db.session.get(Project, pid)
    if not p: abort(404)
    secs = Section.query.order_by(Section.order_idx).all()
    if request.method == 'POST':
        p.title_ar=request.form['title_ar']; p.title_en=request.form['title_en']
        p.description_ar=request.form.get('description_ar',''); p.description_en=request.form.get('description_en','')
        p.section_id=int(request.form['section_id'])
        p.subsection_id=int(request.form['subsection_id']) if request.form.get('subsection_id') else None
        p.video_url=request.form.get('video_url',''); p.link_url=request.form.get('link_url','')
        p.tech_tags=request.form.get('tech_tags',''); p.order_idx=int(request.form.get('order_idx',0))
        if 'cover_file' in request.files and request.files['cover_file'].filename:
            f=request.files['cover_file']
            if allowed_file(f.filename):
                fn=secure_filename(f.filename); f.save(os.path.join(app.config['UPLOAD_FOLDER'],fn)); p.cover_image=fn
        elif request.form.get('cover_url'):
            p.cover_image=request.form['cover_url']
        # Handle multiple project images
        files = request.files.getlist('project_images')
        existing_count = len(p.images)
        for idx, fi in enumerate(files):
            if fi.filename and allowed_file(fi.filename):
                fn = secure_filename(fi.filename)
                fi.save(os.path.join(app.config['UPLOAD_FOLDER'], fn))
                db.session.add(ProjectImage(project_id=p.id, image_path=fn, order_idx=existing_count+idx))
        db.session.commit(); flash('تم التحديث','success'); return redirect(url_for('admin_projects'))
    return render_template('admin/project_form.html', project=p, sections=secs)

@app.route('/admin/projects/delete/<int:pid>')
@perm_required('can_manage_projects')
def admin_project_delete(pid):
    p = db.session.get(Project, pid)
    if p: db.session.delete(p); db.session.commit(); flash('تم الحذف','success')
    return redirect(url_for('admin_projects'))

@app.route('/admin/projects/images/delete/<int:img_id>')
@perm_required('can_manage_projects')
def admin_project_image_delete(img_id):
    img = db.session.get(ProjectImage, img_id)
    if img:
        pid = img.project_id
        db.session.delete(img); db.session.commit()
        flash('تم حذف الصورة','success')
        return redirect(url_for('admin_project_edit', pid=pid))
    return redirect(url_for('admin_projects'))

# ── Team ────────────────────────────────────────────────────
@app.route('/admin/team')
@perm_required('can_manage_team')
def admin_team():
    return render_template('admin/about.html', members=TeamMember.query.all())

@app.route('/admin/team/add', methods=['POST'])
@perm_required('can_manage_team')
def admin_team_add():
    img = ''
    if 'image' in request.files and request.files['image'].filename:
        f=request.files['image']
        if allowed_file(f.filename):
            fn=secure_filename(f.filename); f.save(os.path.join(app.config['UPLOAD_FOLDER'],fn)); img=fn
    db.session.add(TeamMember(name_ar=request.form['name_ar'],name_en=request.form['name_en'],
        role_ar=request.form['role_ar'],role_en=request.form['role_en'],
        skills_ar=request.form.get('skills_ar',''),skills_en=request.form.get('skills_en',''),image=img))
    db.session.commit(); flash('تم الإضافة','success')
    return redirect(url_for('admin_team'))

@app.route('/admin/team/edit/<int:tid>', methods=['POST'])
@perm_required('can_manage_team')
def admin_team_edit(tid):
    t = db.session.get(TeamMember, tid)
    if not t: abort(404)
    t.name_ar = request.form['name_ar']; t.name_en = request.form['name_en']
    t.role_ar = request.form['role_ar']; t.role_en = request.form['role_en']
    t.skills_ar = request.form.get('skills_ar', ''); t.skills_en = request.form.get('skills_en', '')
    if 'image' in request.files and request.files['image'].filename:
        f = request.files['image']
        if allowed_file(f.filename):
            fn = secure_filename(f.filename)
            f.save(os.path.join(app.config['UPLOAD_FOLDER'], fn))
            t.image = fn
    db.session.commit(); flash('تم التحديث','success')
    return redirect(url_for('admin_team'))

@app.route('/admin/team/delete/<int:tid>')
@perm_required('can_manage_team')
def admin_team_delete(tid):
    t = db.session.get(TeamMember, tid)
    if t: db.session.delete(t); db.session.commit(); flash('تم الحذف','success')
    return redirect(url_for('admin_team'))

# ── Content ─────────────────────────────────────────────────
@app.route('/admin/content')
@perm_required('can_manage_content')
def admin_content():
    return render_template('admin/site_content.html', content=SiteContent.query.all())

@app.route('/admin/content/save', methods=['POST'])
@perm_required('can_manage_content')
def admin_content_save():
    processed = set()
    for key in request.form:
        if key.endswith('_ar'):
            base = key[:-3]
            if base in processed: continue
            processed.add(base)
            ar = request.form.get(f'{base}_ar', '')
            en = request.form.get(f'{base}_en', '')
            sc = SiteContent.query.filter_by(key_name=base).first()
            if sc:
                sc.text_ar = ar; sc.text_en = en
            else:
                db.session.add(SiteContent(key_name=base, text_ar=ar, text_en=en))
    db.session.commit(); flash('تم الحفظ','success')
    return redirect(url_for('admin_content'))

@app.route('/admin/content/add', methods=['POST'])
@perm_required('can_manage_content')
def admin_content_add():
    key = request.form.get('key_name','').strip()
    if key and not SiteContent.query.filter_by(key_name=key).first():
        db.session.add(SiteContent(key_name=key,
            text_ar=request.form.get('text_ar',''),
            text_en=request.form.get('text_en','')))
        db.session.commit(); flash('تم الإضافة','success')
    return redirect(url_for('admin_content'))

# ── Admins Management (Super Admin) ────────────────────────
@app.route('/admin/admins')
@super_admin_required
def admin_admins():
    return render_template('admin/admins.html', admins=Admin.query.all())

@app.route('/admin/admins/add', methods=['POST'])
@super_admin_required
def admin_admins_add():
    u=request.form.get('username','').strip(); pw=request.form.get('password','')
    if not u or not pw:
        flash('مطلوب اسم المستخدم وكلمة المرور','error'); return redirect(url_for('admin_admins'))
    if Admin.query.filter_by(username=u).first():
        flash('اسم المستخدم موجود','error'); return redirect(url_for('admin_admins'))
    db.session.add(Admin(username=u,password_hash=generate_password_hash(pw),
        role=request.form.get('role','admin'),
        can_manage_projects='can_manage_projects' in request.form,
        can_manage_sections='can_manage_sections' in request.form,
        can_manage_content='can_manage_content' in request.form,
        can_manage_team='can_manage_team' in request.form,
        can_manage_logo='can_manage_logo' in request.form,
        can_manage_admins='can_manage_admins' in request.form))
    db.session.commit(); flash('تم الإضافة','success')
    return redirect(url_for('admin_admins'))

@app.route('/admin/admins/update/<int:aid>', methods=['POST'])
@super_admin_required
def admin_admins_update(aid):
    a=db.session.get(Admin,aid)
    if not a: abort(404)
    if a.role=='super_admin' and a.id==current_user.id:
        flash('لا يمكنك تعديل صلاحياتك','error'); return redirect(url_for('admin_admins'))
    a.can_manage_projects='can_manage_projects' in request.form
    a.can_manage_sections='can_manage_sections' in request.form
    a.can_manage_content='can_manage_content' in request.form
    a.can_manage_team='can_manage_team' in request.form
    a.can_manage_logo='can_manage_logo' in request.form
    a.can_manage_admins='can_manage_admins' in request.form
    if request.form.get('new_password'): a.password_hash=generate_password_hash(request.form['new_password'])
    db.session.commit(); flash('تم التحديث','success')
    return redirect(url_for('admin_admins'))

@app.route('/admin/admins/delete/<int:aid>')
@super_admin_required
def admin_admins_delete(aid):
    a=db.session.get(Admin,aid)
    if a and a.id!=current_user.id: db.session.delete(a); db.session.commit(); flash('تم الحذف','success')
    return redirect(url_for('admin_admins'))

# ── API ─────────────────────────────────────────────────────
@app.route('/api/subsections/<int:section_id>')
def api_subsections(section_id):
    subs=SubSection.query.filter_by(section_id=section_id).order_by(SubSection.order_idx).all()
    return jsonify([{'id':s.id,'name_ar':s.name_ar,'name_en':s.name_en,'slug':s.slug} for s in subs])

# ── Errors ──────────────────────────────────────────────────
@app.errorhandler(403)
def err403(e): return render_template('admin/login.html', error='ليس لديك صلاحية'), 403
@app.errorhandler(404)
def err404(e): return render_template('index.html', content={}, projects=[], team=[], sections=sections_json()), 404

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
