from fastapi import FastAPI
from app.routers import resources,c_glance,t_glance,apply_actions,umap,upload,groupcfe,globece  # Import your router
from fastapi.middleware.cors import CORSMiddleware
 
app = FastAPI()
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
		   "http://localhost:59605",
                   "http://leviathan.imsi.athenarc.gr:5173/",
                   "http://195.251.63.129:5173/",
                   "http://leviathan.imsi.athenarc.gr",
                   "http://gloves.imsi.athenarc.gr",
                   "http://gloves.imsi.athenarc.gr:8000/",
                   "http://gloves.imsi.athenarc.gr:8001/"
                   "http://localhost:5175",
                   "http://localhost:8000",
                   "http://127.0.0.1:8000/"
                   ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
# Include the router for available datasets and models
app.include_router(upload.router)
app.include_router(resources.router)
app.include_router(c_glance.router)
app.include_router(t_glance.router)
app.include_router(groupcfe.router)
app.include_router(globece.router)
app.include_router(apply_actions.router)
app.include_router(umap.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Counterfactual Explanations API!"}
 
 
