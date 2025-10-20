import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface InviteEmailData {
  to: string
  inviterName: string
  challengeName: string
  challengeDescription: string
  inviteToken: string
  appUrl: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data: InviteEmailData = await req.json()
    const { to, inviterName, challengeName, challengeDescription, inviteToken, appUrl } = data

    // Validate required fields
    if (!to || !inviterName || !challengeName || !inviteToken || !appUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create signup link with invite token
    const signupLink = `${appUrl}/signup?invite=${inviteToken}`

    // Email HTML template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Challenge Invitation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px 16px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                        🏆 Challenge Invitation
                      </h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                        Hi there! 👋
                      </p>

                      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                        <strong>${inviterName}</strong> has invited you to join the challenge:
                      </p>

                      <div style="background-color: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 8px;">
                        <h2 style="margin: 0 0 10px; color: #1f2937; font-size: 20px; font-weight: 600;">
                          ${challengeName}
                        </h2>
                        ${challengeDescription ? `
                          <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                            ${challengeDescription}
                          </p>
                        ` : ''}
                      </div>

                      <p style="margin: 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                        Join the challenge and start building better habits together!
                      </p>

                      <!-- CTA Button -->
                      <table role="presentation" style="width: 100%; margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <a href="${signupLink}"
                               style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;">
                              Accept Invitation
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 30px 0 10px; color: #6b7280; font-size: 14px; line-height: 1.5;">
                        Or copy and paste this link into your browser:
                      </p>
                      <p style="margin: 0; color: #667eea; font-size: 14px; word-break: break-all;">
                        ${signupLink}
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; text-align: center;">
                      <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                        This invitation will expire in 30 days.
                      </p>
                      <p style="margin: 10px 0 0; color: #9ca3af; font-size: 12px;">
                        Habit Tracker - Build Better Habits Together
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `

    const textContent = `
${inviterName} has invited you to join the challenge!

Challenge: ${challengeName}
${challengeDescription ? `Description: ${challengeDescription}` : ''}

Accept your invitation by clicking this link:
${signupLink}

This invitation will expire in 30 days.

---
Habit Tracker - Build Better Habits Together
    `.trim()

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'The Way of Kaizen <invites@thewayofkaizen.com>',
        to: [to],
        subject: `${inviterName} invited you to join "${challengeName}"`,
        html: htmlContent,
        text: textContent,
      }),
    })

    if (!emailResponse.ok) {
      const error = await emailResponse.text()
      console.error('Resend API error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = await emailResponse.json()

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error sending invitation email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
