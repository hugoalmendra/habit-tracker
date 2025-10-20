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

    console.log('Received invitation request:', { to, inviterName, challengeName })

    // Validate required fields
    if (!to || !inviterName || !challengeName || !inviteToken || !appUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create signup link with invite token
    const signupLink = `${appUrl}/signup?invite=${inviteToken}`

    // Email HTML template with The Way of Kaizen brand colors
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Challenge Invitation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #FAFAF9;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);">

                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 32px; text-align: center; background-color: #0F172A; border-radius: 16px 16px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">
                        Challenge Invitation
                      </h1>
                      <p style="margin: 8px 0 0; color: #F59E0B; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                        The Way of Kaizen
                      </p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 24px; color: #18181B; font-size: 16px; line-height: 1.6;">
                        Hello,
                      </p>

                      <p style="margin: 0 0 24px; color: #18181B; font-size: 16px; line-height: 1.6;">
                        <strong style="color: #DC2626;">${inviterName}</strong> has invited you to join a challenge:
                      </p>

                      <div style="background-color: #FAFAF9; border-left: 4px solid #DC2626; padding: 24px; margin: 24px 0; border-radius: 8px;">
                        <h2 style="margin: 0 0 12px; color: #0F172A; font-size: 20px; font-weight: 700; letter-spacing: -0.01em;">
                          ${challengeName}
                        </h2>
                        ${challengeDescription ? `
                          <p style="margin: 0; color: #18181B; font-size: 15px; line-height: 1.6;">
                            ${challengeDescription}
                          </p>
                        ` : ''}
                      </div>

                      <p style="margin: 24px 0 32px; color: #18181B; font-size: 16px; line-height: 1.6;">
                        Join this challenge and commit to continuous improvement together.
                      </p>

                      <!-- CTA Button -->
                      <table role="presentation" style="width: 100%; margin: 32px 0;">
                        <tr>
                          <td align="center">
                            <a href="${signupLink}"
                               style="display: inline-block; padding: 16px 40px; background-color: #DC2626; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: -0.01em; box-shadow: 0 2px 8px rgba(220, 38, 38, 0.2);">
                              Accept Invitation
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 32px 0 8px; color: #71717A; font-size: 13px; line-height: 1.5;">
                        Or copy this link:
                      </p>
                      <p style="margin: 0; color: #DC2626; font-size: 13px; word-break: break-all; background-color: #FAFAF9; padding: 12px; border-radius: 6px;">
                        ${signupLink}
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 40px 32px; background-color: #FAFAF9; border-radius: 0 0 16px 16px; text-align: center;">
                      <p style="margin: 0 0 8px; color: #71717A; font-size: 12px; line-height: 1.5;">
                        This invitation expires in 30 days.
                      </p>
                      <p style="margin: 0; color: #A1A1AA; font-size: 11px;">
                        © 2025 The Way of Kaizen - Continuous Improvement
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
THE WAY OF KAIZEN - Challenge Invitation

${inviterName} has invited you to join a challenge:

${challengeName}
${challengeDescription ? `${challengeDescription}` : ''}

Accept your invitation:
${signupLink}

This invitation expires in 30 days.

© 2025 The Way of Kaizen - Continuous Improvement
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
        reply_to: 'support@thewayofkaizen.com',
        subject: `${inviterName} invited you to join "${challengeName}"`,
        html: htmlContent,
        text: textContent,
      }),
    })

    if (!emailResponse.ok) {
      const error = await emailResponse.text()
      console.error('Resend API error status:', emailResponse.status)
      console.error('Resend API error details:', error)
      return new Response(
        JSON.stringify({
          error: 'Failed to send email',
          details: error,
          status: emailResponse.status,
          message: 'Resend API rejected the request'
        }),
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
