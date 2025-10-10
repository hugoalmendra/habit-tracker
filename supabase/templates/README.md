# Email Templates for The Way of Kaizen

These are custom email templates with a branded look and feel for your Supabase authentication emails.

## Templates Included

1. **confirm-signup.html** - Welcome email with email confirmation link
2. **invite.html** - Invitation to join the platform
3. **magic-link.html** - Passwordless sign-in link
4. **recovery.html** - Password reset email
5. **email-change.html** - Confirm email address change

## How to Apply These Templates

Since you're using Supabase's hosted platform, you'll need to apply these templates through the Supabase Dashboard:

### Steps:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/rkjbwpqvxtmkwwanhfar

2. Navigate to **Authentication** → **Email Templates** in the left sidebar

3. For each template type (Confirm signup, Magic Link, Change Email Address, Reset Password):
   - Click on the template type
   - Copy the content from the corresponding HTML file in this folder
   - Paste it into the template editor
   - Click **Save**

## Template Variables

Each template uses Supabase's built-in template variable:
- `{{ .ConfirmationURL }}` - The authentication link that users need to click

## Design Features

✨ **Modern Apple-inspired design** with:
- Clean, minimalist layout
- Gradient purple header matching your brand
- Responsive design (works on mobile and desktop)
- Professional typography using system fonts
- Accessible color contrast
- Rounded corners and subtle shadows
- Clear call-to-action buttons

## Customization

Feel free to modify these templates to match your exact brand colors and messaging. The key elements to customize:

- **Brand Colors**: Currently using gradient from `#667eea` to `#764ba2`
- **Logo**: Replace the text header with your logo image if desired
- **Copy**: Adjust the welcome messages and descriptions
- **Footer**: Add social links or additional information

## Testing

After applying the templates:
1. Test sign-up flow to see the confirmation email
2. Test password reset to see the recovery email
3. Test magic link sign-in if enabled

Make sure all links work correctly and the design displays properly across different email clients (Gmail, Outlook, Apple Mail, etc.).
