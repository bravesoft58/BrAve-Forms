const User = require('../models/User');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { email, password, role, company } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create MFA secret
    const mfaSecret = speakeasy.generateSecret({ name: `Jobsite Logs App (${email})` });

    // Create new user
    const user = new User({
      email,
      password,
      role,
      company,
      mfaSecret: mfaSecret.base32
    });

    await user.save();

    // Generate QR code for MFA setup
    const qrCodeUrl = await qrcode.toDataURL(mfaSecret.otpauth_url);

    res.status(201).json({
      message: 'User registered successfully',
      userId: user._id,
      mfaQrCode: qrCodeUrl
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Return user ID for MFA verification
    res.status(200).json({
      message: 'First step authentication successful',
      userId: user._id,
      requiresMfa: true
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Verify MFA code
exports.verifyMfa = async (req, res) => {
  try {
    const { userId, mfaCode } = req.body;

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Verify MFA code
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: mfaCode
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid MFA code' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Authentication successful',
      token,
      userId: user._id,
      role: user.role
    });
  } catch (error) {
    console.error('MFA verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -mfaSecret');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};