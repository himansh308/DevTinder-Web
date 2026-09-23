function UserCard({ user, onInterested, onIgnored }) {
    const { firstName, lastName, photoUrl, age, gender, skills } = user;

    return (
        <div className="card w-96 bg-base-100 shadow-xl">
            <figure className="h-72 overflow-hidden">
                <img
                    src={photoUrl}
                    alt={`${firstName} ${lastName}`}
                    className="w-full h-full object-cover"
                />
            </figure>
            <div className="card-body">
                <h2 className="card-title">
                    {firstName} {lastName}
                    {age && <span className="text-base font-normal ml-1">, {age}</span>}
                </h2>
                {gender && <p className="text-sm opacity-70">{gender}</p>}

                {skills?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {skills.map((skill, index) => (
                            <span key={index} className="badge badge-secondary">
                                {skill}
                            </span>
                        ))}
                    </div>
                )}

                <div className="card-actions justify-center mt-4 gap-4">
                    <button className="btn btn-outline" onClick={onIgnored}>
                        Ignore
                    </button>
                    <button className="btn btn-primary" onClick={onInterested}>
                        Interested
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UserCard;
