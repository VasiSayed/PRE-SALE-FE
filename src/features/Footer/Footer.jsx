import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-left">
          <p className="footer-text">© 2025 LOTUS DEVELOPERS. All rights reserved.</p>
        </div>
        
        <div className="footer-center">
          <a href="#" className="footer-link">Privacy Policy</a>
          <span className="footer-divider">|</span>
          <a href="#" className="footer-link">Terms of Service</a>
          <span className="footer-divider">|</span>
          <a href="#" className="footer-link">Support</a>
        </div>
        
        <div className="footer-right">
          <p className="footer-text">Version 1.0.0</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer