


// Profile Info cards

import { useNavigate } from "react-router-dom"
import { UserContext } from "../context/UserContext"

export const profileInfoCard = () => {
    const navigate = useNavigate()
    const { user, clearUser } = UserContext(UserContext)

    const handleLogout = () => {
        localStorage.clear();
        clearUser();
        navigate('/')
    }

    return (
        user && (
            <div >

            </div>
        )
    )
}