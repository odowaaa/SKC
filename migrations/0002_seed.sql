-- Initial staff/admin account.
-- Email: admin@somalikingcollege.edu.so
-- Temporary password: SKCAdmin2026!
-- IMPORTANT: log in and change this password immediately (Staff Dashboard -> Account -> Change Password).
INSERT INTO staff (full_name, email, password_hash, password_salt, role) VALUES (
  'SKC Administrator',
  'admin@somalikingcollege.edu.so',
  'dedc1f95ef3fef362b97768491135d8b31549fd0fbdf5f8e7dcaab50b5481b53',
  '3d5d7d24d70092351071419bde8d35ba',
  'admin'
);

-- News posts (matches the site's original launch-phase news items)
INSERT INTO news_posts (title, category, excerpt, body, gradient, status, published_at) VALUES
('2026 Founding Enrollment Now Open', 'Admissions', 'Applications are open across all five Schools. Early applicants get priority placement testing slots.', 'SomaliKing College is officially accepting applications for its founding cohort across all five Schools: English & Communication, Information Technology, Engineering & Technical Studies, Social & Human Services, and Health Skills. Open admission applies to beginner English and short skills courses, while certificate and diploma programs use placement testing to find the right starting level.', 'from-primary-700 to-primary-900', 'published', datetime('now', '-6 days')),
('SKC Curriculum Framework Officially Launched', 'Curriculum', 'Our Edition 2.0 competency-based curriculum book now guides teaching across every School.', 'Edition 2.0 of the SKC Curriculum Book now guides teaching, assessment, and quality assurance across every School.', 'from-gold-500 to-gold-700', 'published', datetime('now', '-5 days')),
('Building Internship & Community Partnerships', 'Partnerships', 'SKC is partnering with local businesses, NGOs, and offices for practical attachments.', 'SKC is reaching out to local businesses, NGOs, construction firms, and offices to build practical attachment opportunities for learners.', 'from-primary-500 to-primary-800', 'published', datetime('now', '-4 days')),
('Placement Testing Schedule Announced', 'Admissions', 'English, IT, and diploma-level applicants can now book placement testing sessions.', 'English, IT, and diploma-level applicants can now book placement testing sessions to find their correct starting level.', 'from-primary-700 to-primary-950', 'published', datetime('now', '-3 days')),
('Competency-Based Grading Scale Adopted', 'Curriculum', 'SKC has formalized its A-F grading scale.', 'SKC has formalized its A-F grading scale, requiring learners to pass both theory and practical components.', 'from-gold-600 to-primary-800', 'published', datetime('now', '-2 days')),
('Call for Qualified Teachers & Practical Instructors', 'Announcements', 'SKC is recruiting instructors for the founding term.', 'SKC is recruiting experienced English, IT, engineering, social services, and health instructors for the founding term.', 'from-primary-600 to-primary-900', 'published', datetime('now', '-1 days'));

-- Programs (matches faculties.html / programs.html)
INSERT INTO programs (school, level, title, duration, description, sort_order) VALUES
('it', 'Certificate', 'Certificate in Computer Applications', '6 Months', 'Word, Excel, PowerPoint, PDF workflows, and digital literacy fundamentals.', 1),
('it', 'Certificate', 'Certificate in Digital Business Support', '6 Months', 'Online communication, email professionalism, and digital business tools.', 2),
('it', 'Diploma', 'Diploma in IT Support', '1-2 Years', 'Technical support, troubleshooting, networking, and web foundations.', 3),
('it', 'Advanced Diploma', 'Advanced Diploma in Applied IT', '2 Years', 'Comprehensive IT training culminating in a digital solution portfolio project.', 4),
('engineering', 'Certificate', 'Certificate in General Construction Support', '6-12 Months', 'Construction materials, workmanship, and civil works basics.', 1),
('engineering', 'Certificate', 'Certificate in Electrical and Solar Basics', '6-12 Months', 'Electrical principles, basic wiring, and solar power installation.', 2),
('engineering', 'Certificate', 'Certificate in Plumbing and Water Systems', '6-12 Months', 'Plumbing, water systems, and sanitation fundamentals.', 3),
('engineering', 'Diploma', 'Diploma in Applied Engineering Support', 'Up to 2 Years', 'Technical drawing, surveying, estimation, and a capstone project.', 4),
('social-services', 'Certificate', 'Certificate in Office Administration & Customer Service', '3-12 Months', 'Records management, front desk professionalism, and meeting skills.', 1),
('social-services', 'Certificate', 'Certificate in Community Development & Entrepreneurship', '3-12 Months', 'Community mobilization, leadership, and small business skills.', 2),
('health', 'Certificate', 'Certificate in Community Health Support', '3-12 Months', 'Health promotion, nutrition, and maternal & child health awareness.', 1),
('health', 'Certificate', 'Certificate in First Aid and Safety', '3-12 Months', 'Emergency response basics and safe, responsible referral.', 2),
('health', 'Certificate', 'Certificate in WASH and Hygiene Promotion', '3-12 Months', 'Water, sanitation, and hygiene basics for homes, schools, and workplaces.', 3);

-- Gallery items (matches gallery.html)
INSERT INTO gallery_items (category, caption, gradient, sort_order) VALUES
('english', 'English Classroom', 'from-primary-600 to-primary-900', 1),
('english', 'Speaking Practice', 'from-primary-500 to-primary-800', 2),
('it', 'Computer Lab', 'from-gold-400 to-gold-600', 3),
('it', 'Digital Literacy', 'from-gold-500 to-primary-700', 4),
('engineering', 'Engineering Workshop', 'from-primary-700 to-gold-700', 5),
('engineering', 'Electrical & Solar', 'from-primary-800 to-primary-950', 6),
('health', 'Health Outreach', 'from-gold-600 to-gold-800', 7),
('health', 'First Aid Training', 'from-primary-600 to-gold-600', 8),
('campus', 'Campus Grounds', 'from-primary-500 to-primary-900', 9),
('campus', 'Orientation Day', 'from-gold-500 to-gold-700', 10),
('campus', 'Resource Center', 'from-primary-700 to-primary-900', 11),
('campus', 'Community Outreach', 'from-primary-800 to-gold-700', 12);
