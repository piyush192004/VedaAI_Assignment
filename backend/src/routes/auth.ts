import { Request, Response, Router } from 'express';
import { signToken, requireAuth } from '../lib/auth';
import { User } from '../models/User';

const router = Router();

router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { name, email, password, schoolName, schoolLocation, designation, className, mobile } = req.body;

    if (!name?.trim()) return res.status(400).json({ success: false, error: 'Name is required' });
    if (!email?.trim()) return res.status(400).json({ success: false, error: 'Email is required' });
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      schoolName: schoolName?.trim() || '',
      schoolLocation: schoolLocation?.trim() || '',
      designation: designation?.trim() || '',
      className: className?.trim() || '',
      mobile: mobile?.trim() || '',
    });

    const token = signToken({ userId: user._id.toString(), email: user.email });

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          schoolName: user.schoolName,
          schoolLocation: user.schoolLocation,
          designation: user.designation,
          className: user.className,
          mobile: user.mobile,
          avatar: user.avatar,
        },
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Signup failed';
    return res.status(500).json({ success: false, error: msg });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ success: false, error: 'Invalid email or password' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ success: false, error: 'Invalid email or password' });

    const token = signToken({ userId: user._id.toString(), email: user.email });

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          schoolName: user.schoolName,
          schoolLocation: user.schoolLocation,
          designation: user.designation,
          className: user.className,
          mobile: user.mobile,
          avatar: user.avatar,
        },
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Login failed';
    return res.status(500).json({ success: false, error: msg });
  }
});

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId).select('-password');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    return res.json({ success: true, data: user });
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

router.put('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, schoolName, schoolLocation, designation, className, mobile, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { name, schoolName, schoolLocation, designation, className, mobile, avatar },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    return res.json({ success: true, data: user });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Update failed';
    return res.status(500).json({ success: false, error: msg });
  }
});

export default router;
