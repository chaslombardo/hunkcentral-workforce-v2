'use client';

import * as React from 'react';
import { SmartInput, commonValidationRules, ValidationRule } from './smart-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function SmartInputDemo() {
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    amount: '',
    username: '',
  });

  const [validationStates, setValidationStates] = React.useState<Record<string, boolean>>({});

  const handleValueChange = (field: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleValidationChange = (field: string) => (isValid: boolean) => {
    setValidationStates(prev => ({ ...prev, [field]: isValid }));
  };

  // Custom async validation rule for username availability
  const usernameAvailabilityRule: ValidationRule = {
    test: async (value) => {
      if (value.length < 3) return true; // Don't check short usernames
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate some usernames being taken
      const takenUsernames = ['admin', 'user', 'test', 'demo'];
      return !takenUsernames.includes(value.toLowerCase());
    },
    message: 'This username is already taken',
    type: 'error',
    priority: 5,
  };

  // Password confirmation rule
  const passwordConfirmationRule: ValidationRule = {
    test: (value) => value === formData.password,
    message: 'Passwords do not match',
    type: 'error',
    priority: 1,
  };

  const isFormValid = Object.values(validationStates).every(Boolean);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">SmartInput Component Demo</h1>
        <p className="text-muted-foreground">
          Interactive form inputs with progressive validation, real-time feedback, and accessibility features
        </p>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Examples</TabsTrigger>
          <TabsTrigger value="validation">Validation Rules</TabsTrigger>
          <TabsTrigger value="progressive">Progressive Validation</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Features</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Input Examples</CardTitle>
              <CardDescription>
                Simple inputs with different states and configurations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SmartInput
                label="Basic Input"
                placeholder="Enter some text..."
                hint="This is a basic input with hint text"
              />

              <SmartInput
                label="Input with Success State"
                value="Valid input"
                success="This input looks good!"
                readOnly
              />

              <SmartInput
                label="Input with Error State"
                value="Invalid input"
                error="This input has an error"
                readOnly
              />

              <SmartInput
                label="Loading Input"
                placeholder="Processing..."
                loading={true}
                readOnly
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Validation Rules</CardTitle>
              <CardDescription>
                Inputs with different validation rules and real-time feedback
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SmartInput
                label="Email Address"
                type="email"
                placeholder="Enter your email..."
                hint="We'll never share your email with anyone else"
                validationRules={[
                  commonValidationRules.required(),
                  commonValidationRules.email(),
                ]}
                onValueChange={handleValueChange('email')}
                onValidationChange={handleValidationChange('email')}
                validateOnChange={true}
              />

              <SmartInput
                label="Phone Number"
                type="tel"
                placeholder="Enter your phone number..."
                validationRules={[
                  commonValidationRules.required(),
                  commonValidationRules.phone(),
                ]}
                onValueChange={handleValueChange('phone')}
                onValidationChange={handleValidationChange('phone')}
              />

              <SmartInput
                label="Amount"
                type="number"
                placeholder="0.00"
                hint="Enter a positive amount"
                validationRules={[
                  commonValidationRules.required(),
                  commonValidationRules.numeric(),
                  commonValidationRules.positiveNumber(),
                ]}
                onValueChange={handleValueChange('amount')}
                onValidationChange={handleValidationChange('amount')}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progressive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Progressive Validation</CardTitle>
              <CardDescription>
                Validation that appears progressively as the user interacts with the form
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SmartInput
                label="Username"
                placeholder="Choose a username..."
                hint="Username must be at least 3 characters long"
                validationRules={[
                  commonValidationRules.required(),
                  commonValidationRules.minLength(3),
                  commonValidationRules.maxLength(20),
                  usernameAvailabilityRule,
                ]}
                onValueChange={handleValueChange('username')}
                onValidationChange={handleValidationChange('username')}
                validateOnChange={true}
                progressiveValidation={true}
                debounceMs={500}
              />

              <SmartInput
                label="Password"
                type="password"
                placeholder="Create a strong password..."
                hint="Password should be at least 8 characters long"
                showPasswordToggle={true}
                validationRules={[
                  commonValidationRules.required(),
                  commonValidationRules.minLength(8),
                  commonValidationRules.strongPassword(),
                  commonValidationRules.passwordStrengthWarning(),
                ]}
                onValueChange={handleValueChange('password')}
                onValidationChange={handleValidationChange('password')}
                validateOnChange={true}
                progressiveValidation={true}
              />

              <SmartInput
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password..."
                showPasswordToggle={true}
                validationRules={[
                  commonValidationRules.required(),
                  passwordConfirmationRule,
                ]}
                onValueChange={handleValueChange('confirmPassword')}
                onValidationChange={handleValidationChange('confirmPassword')}
                validateOnChange={true}
                progressiveValidation={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Features</CardTitle>
              <CardDescription>
                Advanced input features including accessibility and custom validation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SmartInput
                label="Custom Validation"
                placeholder="Type 'hello world'..."
                hint="This input has custom validation logic"
                validationRules={[
                  {
                    test: (value) => value.toLowerCase() === 'hello world',
                    message: 'Please type exactly "hello world"',
                    type: 'error',
                    priority: 1,
                  },
                  {
                    test: (value) => value.length > 5,
                    message: 'Getting closer! Keep typing...',
                    type: 'info',
                    priority: 2,
                  },
                ]}
                validateOnChange={true}
                progressiveValidation={true}
              />

              <SmartInput
                label="Character Counter"
                placeholder="Type something..."
                hint="This input shows character count"
                maxLength={100}
                validationRules={[
                  commonValidationRules.maxLength(100),
                  {
                    test: () => true,
                    message: '0/100 characters', // Will be updated dynamically
                    type: 'info',
                    priority: 10,
                  },
                ]}
                validateOnChange={true}
                progressiveValidation={true}
              />

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Form Validation Status</h4>
                    <p className="text-sm text-muted-foreground">
                      Overall form validation state
                    </p>
                  </div>
                  <Badge variant={isFormValid ? "default" : "destructive"}>
                    {isFormValid ? "Valid" : "Invalid"}
                  </Badge>
                </div>
                
                <div className="mt-4">
                  <Button 
                    disabled={!isFormValid}
                    className="w-full"
                  >
                    Submit Form
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Accessibility Features</CardTitle>
          <CardDescription>
            This component includes comprehensive accessibility support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">ARIA</Badge>
              Proper ARIA labels, descriptions, and invalid states
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Keyboard</Badge>
              Full keyboard navigation support
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Screen Reader</Badge>
              Descriptive text for screen reader users
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Focus</Badge>
              Clear focus indicators and management
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Color</Badge>
              Color-blind friendly with icons and text
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}