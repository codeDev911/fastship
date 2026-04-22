import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest,
  { params }: { params: { id: string } }

) {
  try {
    const id = (await params).id;

    const driver = await prisma.driver.findUnique({
      where: { id },
      
    });
    const business = await prisma.business.findFirst({
      where:{
        drivers:{
          some:{
            id:driver?.id
          }
        }
      },
      select:{
        id:true,
        companyName:true,
        businessType:true,
        rating:true,
        user:{
          select:{
            id:true,
            email:true,
            phone:true
          }
        }
      }
    })

    if(!driver) {
      return NextResponse.json({ message: 'Driver not found' }, { status: 404 });
    }
    console.log(business);
    
    return NextResponse.json({...driver,...business});

  } catch (error) {
    console.error('[v0] Driver orders error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch orders';
    return NextResponse.json({ message }, { status: 500 });
  }
}
 
