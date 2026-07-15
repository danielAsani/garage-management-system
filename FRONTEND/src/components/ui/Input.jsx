

function Input({ label, type = "text", value, onChange, placeholder, required = false, ...props }) {

    return (
        <div className="mb-3">
            {label && <label className="form-label"> {label} </label>}

            <input
                type={type}
                className="form-control"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                {...props}
            />  
        
        </div>
    );
    
}

export default Input
