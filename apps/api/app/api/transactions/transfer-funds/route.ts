import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { financialService } from "@/lib/services/financial.service";
import { validateCSRFMiddleware, csrfErrorResponse } from "@/lib/csrf-middleware";


export async function POST(req:NextRequest) {
    try {
        // Validate CSRF token for this state-changing request
        if (!(await validateCSRFMiddleware(req))) {
            return csrfErrorResponse();
        }

        const {from,to,fromId,toId,amount,description,uniqueId} = await req.json()
       

        
        return await prisma.$transaction(async(tx)=>{
            await financialService.transferFunds(tx,from?.toLowerCase(),to?.toLowerCase(),fromId,toId,Number(amount),description ,uniqueId)
            return NextResponse.json({success:true},{status:201})
        },{timeout:100000})
        
    } catch (error) {
        console.log(error);
        
        return NextResponse.json({error:"Internal server error"},{status:500})
    }
}
