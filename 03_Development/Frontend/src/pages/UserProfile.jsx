import Header from "./Header";
import Footer from "./Footer";
import "../Styles/Header.css";
import "../Styles/Footer.css";

function UserProfile() {
    return (
        <div>
            <Header />
            <div className="user-profile">
                <h1>User Profile</h1>
            </div>

            <Footer />
        </div>
    );
}
export default UserProfile;