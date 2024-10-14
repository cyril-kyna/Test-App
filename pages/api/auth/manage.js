import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { loginFormSchema, registerFormSchema } from '@/lib/validation/validation-schema';
import { v4 as uuidv4 } from 'uuid';
import * as Yup from 'yup';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// Function to generate a 6-character employee number using UUID
function generateEmployeeNo() {
  return uuidv4().replace(/-/g, '').substring(0, 6).toUpperCase();
}

// Function to validate user and employee data
async function validateData(schema, data, res) {
  try {
    await schema.validate(data, { abortEarly: false });
    return true;
  } catch (error) {
    if (error instanceof Yup.ValidationError) {
      const validationErrors = {};
      error.inner.forEach((item) => {
        validationErrors[item.path] = item.message;
      });
      res.status(400).json({ errors: validationErrors });
      return false;
    }
    res.status(500).json({ message: 'Internal Server Error' });
    return false;
  }
}

// Handle user registration and login
export default async function handler(req, res) {
  const { action, username, password, firstName, lastName, gender } = req.body;

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Create an empty errors object to store any validation issues
  const validationErrors = {};

  // Validate the 'action' field manually
  if (!action || (action !== 'create' && action !== 'read')) {
    validationErrors['action'] = 'Invalid action';
  }

  // Check if it's a registration action
  if (action === 'create') {
    const userData = { username, password, status: 'ACTIVE' };
    const employeeData = { firstName, lastName, gender, employeeNo: generateEmployeeNo() };

    const isRegisterValid = await validateData(registerFormSchema, { ...userData, ...employeeData }, res);

    // If validation for form fields fails, merge the errors with action validation
    if (!isRegisterValid) {
      return; // Response is already sent in `validateData`
    }

    // Proceed with user registration logic if no errors
    if (Object.keys(validationErrors).length === 0) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { username },
        });

        if (existingUser) {
          return res.status(409).json({ message: 'Username is already taken' });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const newEmployee = await prisma.employee.create({
          data: {
            firstName: employeeData.firstName,
            lastName: employeeData.lastName,
            gender: employeeData.gender,
            employeeNo: employeeData.employeeNo,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        const newUser = await prisma.user.create({
          data: {
            username: userData.username,
            password: hashedPassword,
            status: userData.status,
            employeeID: newEmployee.employeeNo,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        return res.status(201).json({
          message: 'User and Employee created successfully',
          user: newUser,
          employee: newEmployee,
        });
      } catch (error) {
        return res.status(500).json({ message: 'Database error', error: error.message });
      }
    }
  }

  // If it's a login action
  else if (action === 'read') {
    const userData = { username, password };

    const isLoginValid = await validateData(loginFormSchema, userData, res);

    // If validation for form fields fails, merge the errors with action validation
    if (!isLoginValid) {
      return; // Response is already sent in `validateData`
    }

    // Proceed with user login logic if no errors
    if (Object.keys(validationErrors).length === 0) {
      try {
        const user = await prisma.user.findUnique({
          where: { username },
        });

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return res.status(401).json({ message: 'Wrong password' });
        }

        return res.status(200).json({
          message: 'Login successful',
          user: {
            id: user.id,
            username: user.username,
            status: user.status,
          },
        });
      } catch (error) {
        return res.status(500).json({ message: 'Database error', error: error.message });
      }
    }
  }

  // If there are validation errors for 'action', return them
  if (Object.keys(validationErrors).length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }
}
