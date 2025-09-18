enum PromiseState {
    PENDING = 'pending',
    FULFILLED = 'fulfilled',
    REJECTED = 'rejected'
}

class MyPromise<T, K>{

    private _state: PromiseState = PromiseState.PENDING;
    private _value?: T; //success value
    private _reason?: K //failure reason

    private _successHandlers: ((val: T) => void)[] = [];
    private _failureHandlers: ((err: K) => void)[] = [];
    private _finallyHandlers: (() => void)[] = [];

    constructor(executor:(resolve:(val: T) => void, reject:(err: K)=> void) => void){

        try {
            executor(this._resolve.bind(this), this._reject.bind(this));
        } catch (error) {
            this._reject(error as K);
        }
    }

    public then(handler: (val: T)=> void){
        if(this._state === PromiseState.FULFILLED && this._value !== undefined){
            queueMicrotask(() => {
                handler(this._value as T);
            });
        }else{
            this._successHandlers.push(handler);
        }
        return this;
    }

    public catch(handler: (err: K)=> void){
        if(this._state === PromiseState.REJECTED && this._reason !== undefined){
            queueMicrotask(()=>{
                handler(this._reason as K);
            })
        }else{
            this._failureHandlers.push(handler);
        }

        return this;
    }

    public finally(handler:()=> void){

        if(this._state !== PromiseState.PENDING){
            queueMicrotask(()=>{
                handler();
            });
        }else{
            this._finallyHandlers.push(handler);
        }
        return this;
    }

    
    private _resolve(val: T){
        if(this._state !== PromiseState.PENDING) return;

        this._state = PromiseState.FULFILLED
        this._value = val;

        queueMicrotask(()=>{
            this._successHandlers.forEach(fn => fn(val));
            this._finallyHandlers.forEach(fn => fn());
        });

    }

    private _reject(err: K){
        if(this._state !== PromiseState.PENDING) return;

        this._state = PromiseState.REJECTED;
        this._reason = err;

        queueMicrotask(()=>{
            this._failureHandlers.forEach(fn => fn(err));
            this._finallyHandlers.forEach(fn => fn());
        });
    }
}

// Example usage:
const waitFor = (s : number)=>

    new MyPromise<number, string>((resolve, reject)=>{

        setTimeout(()=>{
            if(s % 2 === 0){
                resolve(s);
            }else reject(`Odd number ${s}, rejected!`);

        }, s * 1000);
    });

    waitFor(3)
    .then((val)=>{
        console.log(`Resolved with value: ${val}`);
    })
    .catch((err)=>{
        console.error(`Rejected with reason: ${err}`);
    })
    .finally(()=>{
        console.log('Operation completed.');
    });