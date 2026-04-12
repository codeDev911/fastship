import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { financialService } from "@/lib/services/financial.service";


export async function POST(req:NextRequest) {
    try {
        const {from,to,fromId,toId,amount} = await req.json()
        let user = await prisma.user.findUnique({
            where:{
                id:toId
            },
            select:{
                driver:{
                    select:{
                        id:true
                    }
                },
                seller:{
                    select:{
                        id:true
                    }
                },
                business:{
                    select:{
                        id:true
                    }
                }
            }
        })

        if(!user){
            return NextResponse.json({error:"No user found"},{status:400})
        }
        let toID = ""
        try {
            toID = user.business.id
        } catch (error) {
            try {
                toID = user.seller.id
                
            } catch (error) {
                toID = user.driver.id
                
            }
        }

        await financialService.transferFunds(from?.toLowerCase(),to?.toLowerCase(),fromId,toID,Number(amount))

        return NextResponse.json({success:true},{status:201})
    } catch (error) {
        console.log(error);
        
        return NextResponse.json({error:"Internal server error"},{status:500})
    }
}
