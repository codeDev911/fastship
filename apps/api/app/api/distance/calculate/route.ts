import { calculateDistanceByCities } from '@/lib/utils/distance';

interface DistanceRequest {
  pickupCity: string;
  pickupState: string;
  deliveryCity: string;
  deliveryState: string;
}

export async function POST(request: Request) {
  try {
    const body: DistanceRequest = await request.json();

    const { pickupCity, pickupState, deliveryCity, deliveryState } = body;

    // Validate required fields
    if (!pickupCity || !pickupState || !deliveryCity || !deliveryState) {
      return Response.json(
        {
          success: false,
          error: 'Missing required fields: pickupCity, pickupState, deliveryCity, deliveryState',
        },
        { status: 400 }
      );
    }

    // Calculate distance
    const result = await calculateDistanceByCities(
      pickupCity,
      pickupState,
      deliveryCity,
      deliveryState
    );

    if (!result) {
      return Response.json(
        {
          success: false,
          error: 'Could not calculate distance for the given cities',
        },
        { status: 400 }
      );
    }

   

    return Response.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Distance calculation error:', error);
    return Response.json(
      {
        success: false,
        error: error.message || 'Failed to calculate distance',
      },
      { status: 500 }
    );
  }
}
