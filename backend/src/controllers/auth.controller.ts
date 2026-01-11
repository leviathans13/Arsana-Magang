import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { asyncHandler, ConflictError, UnauthorizedError } from '../middlewares/error.middleware';
import { LoginInput, RegisterInput } from '../validators/auth.validator';

// Register a new user
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, role } = req.body as RegisterInput;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ConflictError('Email already registered', 'email');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  // Generate token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  res.status(201).json({
    success: true,
    data: {
      token,
      user,
    },
    message: 'Registration successful',
  });
});

// Login user
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Generate token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    },
    message: 'Login successful',
  });
});

// Get current user
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedError('Not authenticated');
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  res.json({
    success: true,
    data: user,
  });
});

// Get all users (admin only)
export const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json({
    success: true,
    data: users,
  });
});

// Get user by ID
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    res.status(404).json({
      success: false,
      error: 'User not found',
    });
    return;
  }

  res.json({
    success: true,
    data: user,
  });
});

// Update user
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { email, name, role } = req.body;

  // Check if email is already taken by another user
  if (email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id },
      },
    });

    if (existingUser) {
      throw new ConflictError('Email already in use', 'email');
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(email && { email }),
      ...(name && { name }),
      ...(role && { role }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  res.json({
    success: true,
    data: user,
    message: 'User updated successfully',
  });
});

// Delete user
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.user.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'User deleted successfully',
  });
});
