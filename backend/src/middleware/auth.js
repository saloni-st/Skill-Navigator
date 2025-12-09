const { verifyToken } = require('../utils/auth');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided or invalid format.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token is missing.'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from database (excluding password)
    const user = await User.findById(decoded.id).select('-passwordHash');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user not found.'
      });
    }

    // Add user to request object
    req.user = user;
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired.'
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  next();
};

const auditMiddleware = (event) => {
  return async (req, res, next) => {
    // Store original send function
    const originalSend = res.send;
    
    // Override send function to capture response
    res.send = function(data) {
      // Log the event asynchronously
      setImmediate(async () => {
        try {
          console.log(`📝 Audit log attempt:`, {
            event,
            userId: req.user?._id || req.user?.id,
            userExists: !!req.user,
            sessionId: req.sessionId,
            method: req.method,
            url: req.originalUrl
          });

          await AuditLog.create({
            userId: req.user?._id || req.user?.id,
            sessionId: req.sessionId,
            event: event,
            payload: {
              method: req.method,
              url: req.originalUrl,
              body: req.body,
              query: req.query,
              params: req.params,
              statusCode: res.statusCode
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
          });

          console.log(`✅ Audit log created successfully for event: ${event}`);
        } catch (error) {
          console.error('Audit logging error:', error);
        }
      });
      
      // Call original send function
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  auditMiddleware,
};