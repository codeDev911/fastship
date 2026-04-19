'use client';
import { BusinessLayout } from '@fastship/ui';
import { CashSettlementDesk } from '@fastship/ui';
import React, { useEffect, useState } from 'react';
import { secureFetch } from '@fastship/lib';

import Link from 'next/link';
export default function CashSettlementPage() {

  const [payments, setPayments] = useState([])
  const [stats,setStats]:any = useState({})
  const getPayments = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const businessId = user?.jobId
    try {
      let res = await secureFetch(`/api/payments?businessId=${businessId}`)
      let data = await res.json()
      setPayments(data.payments)
      setStats(data.stats)
      
    } catch (error) {
      alert("error while fetching payments")
    }
  }
  useEffect(() => {
    getPayments()
  }, [])

   
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
const headers = ["ID", "Tax","Date", "Method", "Commission", "Driver", "Status", "Amount","Actions"];
  return (
    <BusinessLayout currentPage="payments-settlements">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payments & Cash Settlement</h1>
        <p className="mt-2 text-muted-foreground">Process driver cash settlements, clear COD debts and view COD payments</p>
      </div>
      <br />
      <div className="">


    <div className="grid mb-4 md:grid-cols-3 gap-4">
      <div className='rounded-2xl space-y-2 bg-white md:p-6 p-6'>
        <p className="text-sm text-muted-foreground">Pending amounts</p>
        <h4 className="text-2xl font-bold">
          Rs. {stats?.pendingAmount||"-"}
        </h4>
        <p className="text-xs text-muted-foreground">Payments lefts on you </p>
      </div>
      <div className='rounded-2xl space-y-2 bg-white md:p-6 p-6'>
        <p className="text-sm text-muted-foreground">Total payments</p>
        <h4 className="text-2xl font-bold">
          Rs. {stats?.totalPayments||"-"}j
        </h4>
        <p className="text-xs text-muted-foreground">Total payments you have made </p>
      </div>
      <div className='rounded-2xl space-y-2 bg-white md:p-6 p-6'>
        <p className="text-sm text-muted-foreground">Amount ratio</p>
        <h4 className="text-2xl font-bold">
          {stats?.amountRatio||"-"} %
        </h4>
        <p className="text-xs text-muted-foreground">Pending payments vs Completed payments </p>
      </div>
    </div>  

    <div className="w-full bg-white  max-h-[80vh] overflow-auto rounded-2xl border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left overflow-x-auto">
          <thead>
            <tr className="border-b border-slate-50">
              {headers.map((header) => (
                <th key={header} className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 ">
            {payments && payments.map((data:any,ind:React.Key)=>(
              <tr key={ind} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-5 text-xs max-w-20 truncate text-slate-500">{data.id}</td>
              <td className="px-6 py-5 text-xs  text-slate-600">Rs. {data.tax}</td>
              <td className="px-6 py-5 text-xs font-medium text-slate-600 text-nowrap">{formatDate(data.createdAt)}</td>
              <td className="px-6 py-5 text-xs font-medium text-slate-600">{data.paymentMethod}</td>
              <td className="px-6 py-5 text-xs text-slate-600">Rs. {data.commission}</td>
              <td className="px-6 py-5 text-xs text-slate-600 ">Rs. {data.driverPayable}</td>
              <td className="px-6 py-5">
                <span className={`px-3 py-1 rounded-full ${data.paymentStatus == "PENDING" ?"bg-amber-50 text-amber-600  border-amber-100":"bg-green-50 text-green-600  border-green-100"} text-[10px] font-black uppercase tracking-tight border`}>
                  {data.paymentStatus}
                </span>
              </td>
              <td className="">
                <span className="text-sm font-medium">Rs. {data.amount}</span>
              </td>
              <td className="">
                <span className="text-sm  text-slate-900">
                  <Link className='hover:underline' href={`/business/shipments/${data.shipmentId}`}>View shipment</Link>
                </span>
              </td>
            </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

<br />
      </div>
      <CashSettlementDesk />





    </BusinessLayout>
  );
}
