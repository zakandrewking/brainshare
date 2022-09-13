import { Link } from "react-router-dom";

// import { UserSessionContext } from '../context/UserSession'
// import { logOut } from '../api/auth'

const Logo = () => (
  <Link to="/">
    <div style={{ fontFamily: "'Domine', serif" }}>Brainshare Metabolism</div>
  </Link>
);

export default function Navigation({
  children,
}: {
  children: React.ReactNode;
}) {
  //   const session = useContext(UserSessionContext)
  //   const navigate = useNavigate();
  //   const [open, setOpen] = useState(false);
  return (
    <div>
      <Logo />
      {children}
    </div>
  );
}
