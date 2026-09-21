// =========================================
// LIWI-KA CUSTOMER AUTHENTICATION FRONTEND
// =========================================


// PASSWORD VIEW BUTTONS

const passwordButtons = document.querySelectorAll(".password-toggle");

passwordButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        const targetId = button.getAttribute("data-target");
        const passwordInput = document.getElementById(targetId);

        if (passwordInput.type === "password") {

            passwordInput.type = "text";
            button.textContent = "HIDE";

            setTimeout(function () {

                passwordInput.type = "password";
                button.textContent = "VIEW";

            }, 1000);

        } else {

            passwordInput.type = "password";
            button.textContent = "VIEW";

        }

    });

});


// TEMPORARY FRONTEND FORM TESTING

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", function (event) {

        event.preventDefault();

        alert(
            "Login frontend is working. Real authentication will be connected to Flask later."
        );

    });

}


const signupForm = document.getElementById("signupForm");

if (signupForm) {

    signupForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const password = document.getElementById("signupPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {

            alert("Passwords do not match.");
            return;

        }

        alert(
            "Signup frontend is working. Account creation will be connected to Flask later."
        );

    });

}