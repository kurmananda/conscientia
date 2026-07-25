import { NextResponse } from 'next/server';

export async function POST(req) {
  try {

    // Now, create the event
    const eventData = {
      name: "Online Workshop",
      start_date: "2026-05-10 10:00:00",
      end_date: "2026-05-10 17:00:00",
      short_description: "Conscientia 2026 Online Workshops",
      is_online: true,
      is_public: true,
      is_published: true,
      genre: "Workshops",
      description: "Comprehensive online workshops covering various technical topics including satellite building, launch vehicle design, agentic AI, and Python programming.",
      address: {
        place_id: "ChIJAQAAUP1CpjsRbNo7ldt3ir4"
      },
      tags: ["workshops", "technical", "online", "conscientia"]
    };

    const response = await fetch('https://api.tiqr.events/organiser/event/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    const text = await response.text();

    console.log('TiQR Response:', text);

    return new Response(text, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'text/html',
      },
    });
  } catch (error) {
    console.error("Event creation error:", error);
    return NextResponse.json({ message: 'Event creation failed', error: error.message }, { status: 500 });
  }
}   