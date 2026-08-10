type BeehiivResult =
  | { ok: true; subscriptionId?: string }
  | { ok: false; error: string }

export async function subscribeToBeehiiv(email: string): Promise<BeehiivResult> {
  const apiKey = process.env.BEEHIIV_API_KEY
  const publicationID = process.env.BEEHIIV_PUBLICATION_ID

  if (!apiKey || !publicationID) {
    return { ok: false, error: 'Newsletter integration is not configured yet.' }
  }

  try {
    const response = await fetch(
      `https://api.beehiiv.com/v2/publications/${publicationID}/subscriptions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          reactivate_existing: false,
          send_welcome_email: true,
          double_opt_override: 'off',
        }),
      },
    )

    const body = (await response.json().catch(() => null)) as
      | { data?: { id?: string }; errors?: Array<{ message?: string }> }
      | null

    if (!response.ok) {
      return {
        ok: false,
        error: body?.errors?.[0]?.message || 'Beehiiv could not add this subscription.',
      }
    }

    return { ok: true, subscriptionId: body?.data?.id }
  } catch {
    return { ok: false, error: 'The newsletter service is temporarily unavailable.' }
  }
}
