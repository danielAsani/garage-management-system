function Button({ children, type = "button", variant = "primary", className = "", disabled = false, ...props }) {

    return (
        <button
            type= {type}
            className={`btn btn-${variant} ${className}`}
            disabled={disabled}
            {...props}
        >

            {children}
        </button>
    )
}

export default Button
