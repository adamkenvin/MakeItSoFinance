import React from 'react';

interface HelloWorldProps {
  name?: string;
}

const HelloWorld: React.FC<HelloWorldProps> = ({ name = 'World' }) => {
  return (
    <div className="hello-world">
      <h2 className="text-2xl font-bold text-blue-600 mb-4">
        Hello, {name}! 👋
      </h2>
      <p className="text-gray-700">
        Welcome to the MakeItSo Finance application!
      </p>
      <div className="mt-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700">
        <p className="font-semibold">🎉 Success!</p>
        <p>Your HelloWorld component is working perfectly.</p>
      </div>
    </div>
  );
};

export default HelloWorld;