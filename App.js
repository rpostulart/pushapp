import React from "react";
import { withAuthenticator } from "aws-amplify-react-native";
import Amplify, { Analytics } from "aws-amplify";

// Get the aws resources configuration parameters
import awsconfig from "./aws-exports"; // if you are using Amplify CLI
import Main from "./src/Main";

Amplify.configure(awsconfig);
Analytics.disable(); // disabled analytics otherwise you get annoying messages

class App extends React.Component {
  render() {
    return <Main />;
  }
}

export default withAuthenticator(App);
