import React from 'react'
import DashboardLayout from '../components/DashboardLayout'
import FullTrackerHistoryTable from '../components/FullTrackerHistoryTable'

const TrackerHistoryPage = () => {
    React.useEffect(() => {
        const role = localStorage.getItem('userRole')
        if (!role || role.toLowerCase() !== 'admin') {
            window.location.href = '/dashboard'
        }
    }, [])

    return (
        <DashboardLayout>
            <div className="p-4 md:p-8">
                <FullTrackerHistoryTable />
            </div>
        </DashboardLayout>
    )
}

export default TrackerHistoryPage
