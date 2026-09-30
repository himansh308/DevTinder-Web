import { useNavigate } from "react-router-dom";

function UserCard({ user, onInterested, onIgnored }) {
    const { firstName, lastName, photoUrl, age, gender, skills, mutualConnectionsCount } = user;
    const navigate = useNavigate();
    return (
        <div className="card w-96 bg-base-100 shadow-xl overflow-hidden rounded-2xl">
            <figure className="h-80 relative">
                <img
                    src={photoUrl}
                    alt={`${firstName} ${lastName}`}
                    className="w-full h-full object-cover object-top"
                />

                {mutualConnectionsCount > 0 && (
                    <button
                        className="badge badge-lg badge-neutral absolute top-3 right-3"
                        
                        onClick={()=> navigate(`/mututalConnections/${user._id}`)}
                    >
                        🤝 {mutualConnectionsCount} mutual
                    </button>
                )}
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

                {(onInterested || onIgnored) && (
                    <div className="card-actions justify-center mt-4 gap-4">
                        <button className="btn btn-outline" onClick={onIgnored}>
                            Ignore
                        </button>
                        <button className="btn btn-primary" onClick={onInterested}>
                            Interested
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserCard;
