import { Phone, Clock, MapPin } from 'lucide-react';
import './Footer.css';

export const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <span className="site-footer__logo">Sindhu Store</span>
          <p className="site-footer__copyright">© 2026 Sindhu Store. All rights reserved.</p>
        </div>

        <div className="site-footer__details">
          <a href="tel:03021913300" className="site-footer__item">
            <Phone size={18} className="site-footer__icon" aria-hidden="true" />
            <span>
              <span className="site-footer__label">Phone</span>
              <span className="site-footer__value">03021913300</span>
            </span>
          </a>

          <div className="site-footer__item">
            <Clock size={18} className="site-footer__icon" aria-hidden="true" />
            <span>
              <span className="site-footer__label">Business Hours</span>
              <span className="site-footer__value">Sat - Thu (Closed Friday)</span>
            </span>
          </div>

          <div className="site-footer__item">
            <MapPin size={18} className="site-footer__icon" aria-hidden="true" />
            <span>
              <span className="site-footer__label">Location</span>
              <span className="site-footer__value">
                Near Al-Falah Byco Petroleum, Nawankot Road, Khanpur
              </span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
