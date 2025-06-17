# GLOVES : Global Counterfactual-based Visual Explanations
This repository contains the code for the Demo Paper submission for EDBT 2025.

We introduce Global Counterfactual-based Visual Explanations
(GLOVES), a visualization platform designed to enhance the explainability of decision-making systems through global counterfactual explanations (GCE). GLOVES focuses on visualizing global
counterfactuals, calculated on top of a classifier’s decisions on an
examined population, enabling users to explore and compare different configurations of GCE algorithms interactively.

## Project Structure

### `frontend/`
This folder contains the source code for the web-based user interface of the GLOVES platform. Inside you can find also a detailed ReadMe.md file with the installation steps and the libraries used.

### `backend/`
This folder contains the backend logic and APIs that power the frontend application.  It is implemented using Python and FastAPI and inside the folder you can find a detailed description on how to run the API.

Our tool can be found online at [http://gloves.imsi.athenarc.gr/](http://gloves.imsi.athenarc.gr/).
