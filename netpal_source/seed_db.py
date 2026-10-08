"""
seed_db.py – Populate NetPal database with sections, subsections,
             team members, dummy projects, and site content.
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))

from app import app, db, Admin, Section, SubSection, Project, ProjectImage, TeamMember, SiteContent
from werkzeug.security import generate_password_hash

def seed():
    with app.app_context():
        db.drop_all()
        db.create_all()

        # ── Super Admin ─────────────────────────────────────
        sa = Admin(username='admin', password_hash=generate_password_hash('admin123'),
                   role='super_admin', can_manage_projects=True, can_manage_sections=True,
                   can_manage_content=True, can_manage_team=True, can_manage_logo=True, can_manage_admins=True)
        db.session.add(sa)

        # ── Sections ────────────────────────────────────────
        design   = Section(name_ar='تصميم', name_en='Design', slug='design', icon='palette', order_idx=0)
        motion   = Section(name_ar='إنتاج الفيديو والموشن', name_en='Video & Motion Production', slug='motion', icon='film', order_idx=1)
        dev      = Section(name_ar='برمجة', name_en='Development', slug='dev', icon='code', order_idx=2)
        market   = Section(name_ar='تسويق', name_en='Marketing', slug='marketing', icon='megaphone', order_idx=3)
        db.session.add_all([design, motion, dev, market])
        db.session.flush()

        # ── SubSections ─────────────────────────────────────
        # Design
        d_brand  = SubSection(section_id=design.id, name_ar='هوية بصرية', name_en='Branding', slug='branding', order_idx=0)
        d_social = SubSection(section_id=design.id, name_ar='سوشال ميديا', name_en='Social Media', slug='social', order_idx=1)
        d_uiux   = SubSection(section_id=design.id, name_ar='UI/UX', name_en='UI/UX', slug='uiux', order_idx=2)
        d_print  = SubSection(section_id=design.id, name_ar='مطبوعات', name_en='Print', slug='print', order_idx=3)

        # Motion
        m_2d     = SubSection(section_id=motion.id, name_ar='موشن 2D', name_en='2D Motion', slug='2d', order_idx=0)
        m_3d     = SubSection(section_id=motion.id, name_ar='موشن 3D', name_en='3D Motion', slug='3d', order_idx=1)
        m_reels  = SubSection(section_id=motion.id, name_ar='Reels ومقاطع قصيرة', name_en='Reels & Short Videos', slug='reels', order_idx=2)
        m_ads    = SubSection(section_id=motion.id, name_ar='إنتاج إعلاني', name_en='Ad Production', slug='adprod', order_idx=3)

        # Dev
        v_web    = SubSection(section_id=dev.id, name_ar='مواقع', name_en='Websites', slug='websites', order_idx=0)
        v_app    = SubSection(section_id=dev.id, name_ar='تطبيقات', name_en='Apps', slug='apps', order_idx=1)
        v_bots   = SubSection(section_id=dev.id, name_ar='بوتات', name_en='Bots', slug='bots', order_idx=2)
        v_api    = SubSection(section_id=dev.id, name_ar='API و أتمتة', name_en='API & Automation', slug='api', order_idx=3)

        # Marketing
        mk_sm    = SubSection(section_id=market.id, name_ar='إدارة حسابات', name_en='Account Management', slug='smm', order_idx=0)
        mk_ads   = SubSection(section_id=market.id, name_ar='إعلانات ممولة', name_en='Paid Ads', slug='ads', order_idx=1)
        mk_cont  = SubSection(section_id=market.id, name_ar='تسويق بالمحتوى', name_en='Content Marketing', slug='contentmkt', order_idx=2)

        all_subs = [d_brand, d_social, d_uiux, d_print, m_2d, m_3d, m_reels, m_ads,
                    v_web, v_app, v_bots, v_api, mk_sm, mk_ads, mk_cont]
        db.session.add_all(all_subs)
        db.session.flush()

        # ── Team Members ────────────────────────────────────
        team = [
            TeamMember(name_ar='دانيال', name_en='Daniel', role_ar='مصمم', role_en='Designer',
                       skills_ar='فوتوشوب,اليستريتور,فيجما', skills_en='Photoshop,Illustrator,Figma', image=''),
            TeamMember(name_ar='أحمد', name_en='Ahmad', role_ar='مبرمج', role_en='Developer',
                       skills_ar='Python,JavaScript,Flask', skills_en='Python,JavaScript,Flask', image=''),
            TeamMember(name_ar='ليث', name_en='Laith', role_ar='مونتير وموشن', role_en='Editor & Motion',
                       skills_ar='افتر افكتس,بريمير,DaVinci', skills_en='After Effects,Premiere,DaVinci', image=''),
            TeamMember(name_ar='عمر', name_en='Omar', role_ar='مسوّق رقمي', role_en='Digital Marketer',
                       skills_ar='إعلانات,SEO,محتوى', skills_en='Ads,SEO,Content', image=''),
        ]
        db.session.add_all(team)

        # ── Dummy projects helper ───────────────────────────
        dummy_projects = [
            # Design – Branding
            dict(t_ar='هوية مطعم الأصيل', t_en='Al Aseel Restaurant Branding', d_ar='تصميم هوية بصرية كاملة لمطعم الأصيل تشمل الشعار والألوان والمطبوعات', d_en='Full visual identity for Al Aseel restaurant including logo, colors and prints', sec=design, sub=d_brand, tags='Branding,Logo,Identity'),
            dict(t_ar='هوية كافيه بيردز', t_en='Birds Café Identity', d_ar='شعار وهوية متكاملة لكافيه عصري', d_en='Logo and complete identity for a modern café', sec=design, sub=d_brand, tags='Branding,Café,Modern'),
            dict(t_ar='هوية شركة ريتش', t_en='Reach Company Branding', d_ar='هوية مؤسسية لشركة استشارات', d_en='Corporate identity for a consulting firm', sec=design, sub=d_brand, tags='Corporate,Branding'),
            # Design – Social Media
            dict(t_ar='تصاميم سوشال كلينك', t_en='Clinic Social Media Pack', d_ar='باكج تصاميم سوشال ميديا لعيادة طبية', d_en='Social media design package for a medical clinic', sec=design, sub=d_social, tags='Social,Medical,Posts'),
            dict(t_ar='حملة رمضان الخير', t_en='Ramadan Charity Campaign', d_ar='سلسلة تصاميم لحملة رمضانية خيرية', d_en='Design series for a Ramadan charity campaign', sec=design, sub=d_social, tags='Social,Ramadan,Charity'),
            # Design – UI/UX
            dict(t_ar='واجهة تطبيق توصيل', t_en='Delivery App UI', d_ar='تصميم واجهة مستخدم لتطبيق توصيل طعام', d_en='UI design for a food delivery app', sec=design, sub=d_uiux, tags='UI/UX,App,Figma'),
            dict(t_ar='واجهة متجر إلكتروني', t_en='E-Commerce UI', d_ar='تصميم واجهة متجر أونلاين عصري', d_en='Modern e-commerce store UI design', sec=design, sub=d_uiux, tags='UI/UX,E-Commerce,Web'),
            # Design – Print
            dict(t_ar='بروشور سياحي', t_en='Tourism Brochure', d_ar='بروشور ثلاثي الطي لشركة سياحة', d_en='Tri-fold brochure for a tourism company', sec=design, sub=d_print, tags='Print,Brochure'),
            # Motion – 2D
            dict(t_ar='إعلان موشن لتطبيق', t_en='App Promo Motion', d_ar='فيديو موشن جرافيك ترويجي لتطبيق جوال', d_en='Promotional motion graphic video for a mobile app', sec=motion, sub=m_2d, tags='Motion,2D,App'),
            dict(t_ar='فيديو تعريفي شركة', t_en='Company Intro Video', d_ar='فيديو تعريفي بأسلوب موشن جرافيك', d_en='Company introduction motion graphic video', sec=motion, sub=m_2d, tags='Motion,2D,Intro'),
            dict(t_ar='انفوجرافيك متحرك', t_en='Animated Infographic', d_ar='انفوجرافيك متحرك لإحصائيات سنوية', d_en='Animated infographic for annual statistics', sec=motion, sub=m_2d, tags='Motion,Infographic'),
            # Motion – 3D
            dict(t_ar='لوغو 3D متحرك', t_en='3D Logo Animation', d_ar='تحريك شعار ثلاثي الأبعاد مع تأثيرات ضوئية', d_en='3D logo animation with lighting effects', sec=motion, sub=m_3d, tags='3D,Logo,Animation'),
            dict(t_ar='مشهد منتج 3D', t_en='3D Product Scene', d_ar='عرض ثلاثي الأبعاد لمنتج تجاري', d_en='3D product showcase for a commercial product', sec=motion, sub=m_3d, tags='3D,Product'),
            # Motion – Reels
            dict(t_ar='ريلز مطعم', t_en='Restaurant Reel', d_ar='فيديو ريلز قصير لعرض أطباق مطعم', d_en='Short reel video showcasing restaurant dishes', sec=motion, sub=m_reels, tags='Reels,Food,Short'),
            dict(t_ar='ريلز أزياء', t_en='Fashion Reel', d_ar='ريلز ترويجي لماركة ملابس', d_en='Promotional reel for a clothing brand', sec=motion, sub=m_reels, tags='Reels,Fashion'),
            # Motion – Ads
            dict(t_ar='إعلان تلفزيوني', t_en='TV Commercial', d_ar='إنتاج إعلان تلفزيوني 30 ثانية', d_en='30-second TV commercial production', sec=motion, sub=m_ads, tags='Ad,TV,Production'),
            # Dev – Websites
            dict(t_ar='موقع شركة محاماة', t_en='Law Firm Website', d_ar='موقع احترافي لمكتب محاماة مع نظام حجز مواعيد', d_en='Professional law firm website with appointment booking', sec=dev, sub=v_web, tags='Web,Flask,Booking'),
            dict(t_ar='متجر إلكتروني', t_en='E-Commerce Store', d_ar='متجر إلكتروني متكامل مع بوابة دفع', d_en='Full e-commerce store with payment gateway', sec=dev, sub=v_web, tags='Web,E-Commerce,Payment'),
            dict(t_ar='منصة تعليمية', t_en='Learning Platform', d_ar='منصة كورسات أونلاين مع نظام اشتراكات', d_en='Online courses platform with subscription system', sec=dev, sub=v_web, tags='Web,Education,SaaS'),
            # Dev – Apps
            dict(t_ar='تطبيق مهام', t_en='Tasks App', d_ar='تطبيق إدارة مهام مع تنبيهات وتقويم', d_en='Task management app with notifications and calendar', sec=dev, sub=v_app, tags='App,Flutter,Tasks'),
            dict(t_ar='تطبيق حجوزات', t_en='Booking App', d_ar='تطبيق حجز مواعيد لصالونات التجميل', d_en='Appointment booking app for beauty salons', sec=dev, sub=v_app, tags='App,Booking,Mobile'),
            # Dev – Bots
            dict(t_ar='بوت خدمة عملاء', t_en='Customer Service Bot', d_ar='بوت تلغرام ذكي لخدمة العملاء', d_en='Smart Telegram bot for customer service', sec=dev, sub=v_bots, tags='Bot,Telegram,AI'),
            dict(t_ar='بوت طلبات واتساب', t_en='WhatsApp Orders Bot', d_ar='بوت واتساب لاستقبال ومتابعة الطلبات', d_en='WhatsApp bot for orders management', sec=dev, sub=v_bots, tags='Bot,WhatsApp,Orders'),
            # Dev – API
            dict(t_ar='نظام API متجر', t_en='Store API System', d_ar='API كامل لمتجر مع توثيق Swagger', d_en='Complete store API with Swagger documentation', sec=dev, sub=v_api, tags='API,REST,Swagger'),
            # Marketing – SMM
            dict(t_ar='إدارة حساب مطعم', t_en='Restaurant Account Mgmt', d_ar='إدارة حسابات سوشال ميديا لمطعم لمدة 3 أشهر', d_en='3-month social media management for a restaurant', sec=market, sub=mk_sm, tags='SMM,Restaurant,Growth'),
            dict(t_ar='إدارة حساب عيادة', t_en='Clinic Social Management', d_ar='إدارة محتوى وتصاميم لحسابات عيادة تجميل', d_en='Content and design management for a beauty clinic', sec=market, sub=mk_sm, tags='SMM,Clinic,Content'),
            # Marketing – Paid Ads
            dict(t_ar='حملة إعلانية متجر', t_en='Store Ad Campaign', d_ar='حملة إعلانات جوجل وفيسبوك لمتجر أونلاين', d_en='Google & Facebook ad campaign for an online store', sec=market, sub=mk_ads, tags='Ads,Google,Facebook'),
            dict(t_ar='حملة تطبيق', t_en='App Install Campaign', d_ar='حملة تثبيت تطبيق مع 10 آلاف تنزيل', d_en='App install campaign with 10K downloads', sec=market, sub=mk_ads, tags='Ads,AppInstall,Mobile'),
            # Marketing – Content
            dict(t_ar='خطة محتوى ربع سنوية', t_en='Quarterly Content Plan', d_ar='خطة محتوى 3 أشهر لشركة تقنية', d_en='3-month content plan for a tech company', sec=market, sub=mk_cont, tags='Content,Strategy,Planning'),
            dict(t_ar='سلسلة مقالات SEO', t_en='SEO Article Series', d_ar='كتابة 20 مقال متوافق مع SEO', d_en='Writing 20 SEO-optimized articles', sec=market, sub=mk_cont, tags='SEO,Blog,Content'),
        ]

        placeholder = 'https://placehold.co/800x450/07444E/2FEAAB?text=NetPal+Project'
        for idx, dp in enumerate(dummy_projects):
            p = Project(
                title_ar=dp['t_ar'], title_en=dp['t_en'],
                description_ar=dp['d_ar'], description_en=dp['d_en'],
                section_id=dp['sec'].id, subsection_id=dp['sub'].id,
                cover_image=placeholder, tech_tags=dp['tags'], order_idx=idx
            )
            db.session.add(p)

        # ── Site Content ────────────────────────────────────
        contents = [
            ('hero_title', 'نحن فريق NetPal — نبتكر حضوراً بصرياً يخطف الأنظار ويترك أثراً لا يُنسى',
             'We are NetPal — We create visual presence that captures attention and leaves an unforgettable mark'),
            ('hero_subtitle', 'تصميم | فيديو وموشن | برمجة | تسويق', 'Design | Video & Motion | Development | Marketing'),
            ('about_title', 'فريق واحد. أربع مهارات. إبداع بلا حدود.', 'One Team. Four Skills. Limitless Creativity.'),
            ('about_text', 'نحن في NetPal نؤمن بأن التصميم ليس مجرد شكل.', 'At NetPal, we believe design is more than just looks.'),
            ('feat_1', 'تصميم مبني على هدف', 'Purpose-Driven Design'),
            ('feat_2', 'نظام شغل واضح', 'Clear Workflow'),
            ('feat_3', 'تسليم ملفات جاهز فوراً', 'Instant File Delivery'),
            ('contact_title', 'جاهزين للمشروع الجاي', 'Ready for the Next Project'),
            ('contact_whatsapp', '966500000000', '966500000000'),
            ('contact_email', 'info@netpal.sa', 'info@netpal.sa'),
            ('btn_whatsapp', 'واتساب', 'WhatsApp'),
            ('btn_email', 'إيميل', 'Email'),
            ('footer_copy', 'جميع الحقوق محفوظة NetPal 2026', 'All Rights Reserved NetPal 2026'),
        ]
        for key, ar, en in contents:
            db.session.add(SiteContent(key_name=key, text_ar=ar, text_en=en))

        db.session.commit()
        print('✅ Database seeded successfully!')
        print(f'   Sections: 4, SubSections: {len(all_subs)}, Projects: {len(dummy_projects)}, Team: {len(team)}')
        print('   Admin: admin / admin123')

if __name__ == '__main__':
    seed()
