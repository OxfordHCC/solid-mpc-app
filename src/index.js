import "./basic.css"

// Import from "@inrupt/solid-client-authn-browser"
import {
  login,
  handleIncomingRedirect,
  getDefaultSession,
  fetch
} from "@inrupt/solid-client-authn-browser";

const selectorIdP = document.querySelector("#select-idp");
const selectorPod = document.querySelector("#select-pod");
const textIdP = document.querySelector("#textIdP")
const buttonLogin = document.querySelector("#btnLogin");

function loginToSelectedIdP() {
  let IDP = "";
  if (selectorIdP.value == "") {
    IDP = textIdP.value;
  } else {
    IDP = document.getElementById("select-idp").value;
  }

  return login({
    oidcIssuer: IDP,
    redirectUrl: window.location.href,
    // redirectUrl: "http://localhost:8080", // Only 8080 fails
    clientName: "Solid MPC"
  });
}

async function handleRedirectAfterLogin() {
  await handleIncomingRedirect();

  const session = getDefaultSession();
  if (session.info.isLoggedIn) {
    document.getElementById("login").setAttribute("hidden", "true");
    document.getElementById("user").removeAttribute("hidden");
    document.getElementById("user-webid").textContent = session.info.webId;
  }
}

handleRedirectAfterLogin();

buttonLogin.onclick = function () {
  loginToSelectedIdP();
};

selectorIdP.addEventListener("change", idpSelectionHandler);
function idpSelectionHandler() {
  if (selectorIdP.value === "") {
    textIdP.removeAttribute("hidden");
  } else {
    buttonLogin.removeAttribute("disabled");
    textIdP.setAttribute("hidden", true);
  }
}
