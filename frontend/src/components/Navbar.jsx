import { useContext } from "react"
import { Link } from "react-router-dom"
import { ClipboardCheck, LayoutTemplate } from "lucide-react"
import { ProfileInfoCard } from "./Cards"
import { UserContext } from "../context/userContext"

const Navbar = () => {
  const { user } = useContext(UserContext)

  return (
    <div className="h-16 bg-white/70 backdrop-blur-xl border-b border-violet-100/50 py-2.5 px-4 md:px-0 
    sticky top-0 z-50">
      <div className="max-w-6xl mx-auto  flex items-center justify-between gap-5">

        <Link to="/" className="flex items-center gap-3">
          <div className="flex items-center pb-6 gap-3">

            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl flex 
            items-center justify-center shadow-lg shadow-violet-200">
              <LayoutTemplate className="w-5 h-5 text-white" />
            </div>

            <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-violet-600 to-fuchsia-600 
            bg-clip-text text-transparent">
              ResumeXpert
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            to="/ats-checker"
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-violet-700 hover:text-fuchsia-600 transition-colors"
          >
            <ClipboardCheck className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">ATS Checker</span>
            <span className="sm:hidden">ATS</span>
          </Link>
          {user && (
            <Link
              to="/dashboard"
              className="text-xs sm:text-sm font-bold text-violet-700 hover:text-fuchsia-600 transition-colors hidden sm:inline"
            >
              Dashboard
            </Link>
          )}
          <ProfileInfoCard />
        </div>
      </div>
    </div>
  )
}

export default Navbar
