import DevelopmentServiceControls from "../dev/ServiceControls.jsx";

export default import.meta.env.DEV ? DevelopmentServiceControls : () => null;
