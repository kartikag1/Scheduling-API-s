const express = require('express');
const mongoose = require('mongoose');
const redis = require('redis');
const client = redis.createClient(process.env.PORT||6379);

let dataModel = require('../models/data');
let jobModel = require('../models/job');
let jobQueue = [];


exports.cache = (req,res,next) =>{
	var repliess;
	var count=0;
	var dataToSend=[];
	var totalCount;
	var toIndex;
	var prom1 = new Promise((resolve,reject)=>{
	client.multi().keys('*', function (err, replies) {
		if(!err)
    	repliess=replies;
    	else{
    		next();
    	}
    })
    .exec(function (err, replies) {resolve();});		
	})
	prom1.then(()=>{
		console.log(repliess)
		var prom2 = new Promise((resolve,reject)=>{
 		repliess.forEach(function (reply, index) {
        	if(reply!="0" && reply!="currentindex"){
            client.get(reply, function(err, data){
            		dataToSend.push(data);
                    console.log(dataToSend);
                    count++;
                    if(count>0)
        				resolve();
            });
        }
        })
		})
		prom2.then(()=>{
			res.send(dataToSend);	
		})
	})

}


exports.saveData = (req,res) =>{
	var strnum;
	var prom = new Promise((resolve,reject)=>{
		var index;
		client.get('currentindex', (err,data)=>{
			if(!err){
				index=parseInt(data);
				var incremented_index = index+1;
				strnum = incremented_index.toString();
				client.setex(strnum,3000,req.body.data);
				client.setex('currentindex',3000,strnum);
				resolve();
			}
			else{
				reject();
			}
		})
	})
	prom.then(()=>{
		dataModel.create({data:req.body.data,redis_key:strnum},(err,docs)=>{
			if(!err){
				console.log("data stored in db");
				res.json({"status":"success"});		
			}
			else{
				console.log("data not stored in db");
				res.json({"status":"error"});		
			}
		})
	}).catch(()=>{
		dataModel.create({data:req.body.data},(err,docs)=>{
			if(!err){
				console.log("data stored in db but not in cache");
				res.json({"status":"success"});		
			}
			else{
				console.log("data not stored in db neither in cache");
				res.json({"status":"error"});		
			}
		})
	})	
}

exports.getData = (req,res) =>{	
	let data;
	var prom = new Promise((resolve,reject)=>{
		dataModel.find({},(err,docs)=>{
			if(!err){
				data=docs;
				resolve();
			}
			else{
				reject();
			}
		})
	})
	prom.then(()=>{
		if(data.length){
			res.send(data);
		}
	}).catch(()=>{
		res.json({"status":"error"});
	})	
}

exports.deleteData = (req,res) =>{
	dataModel.find({_id:req.body.id},(err,dataa)=>{
		if(!err && dataa.length){
			client.del(dataa[0]['redis_key'],function(err, response) {
  			 if (response == 1) {
      			console.log("Deleted Successfully!")
   			} else{
    			console.log("Cannot delete")
   			}
		})
		}
	})
	var prom = new Promise((resolve,reject)=>{
		dataModel.deleteOne({_id:req.body.id},(err,docs)=>{
			if(!err){
				resolve();
			}
			else{
				reject();
			}
		})
	})
	prom.then(()=>{
		res.json({"status":"success"});
	}).catch(()=>{
		res.json({"status":"error"});
	})
}

exports.updateData = (req,res) =>{
	const updateObj = {"data":req.body.data};
	var prom = new Promise((resolve,reject)=>{
		dataModel.findOneAndUpdate({_id:req.body.id}, { '$set': updateObj }, (err,docs)=>{
			if(!err){
				resolve();
			}
			else{
				reject();
			}
		})
	})
	prom.then(()=>{
		dataModel.find({data:req.body.data},(err,dataa)=>{
		if(!err && dataa.length){
			client.setex(dataa[0]['redis_key'],3000,req.body.data);
			res.json({"status":"success"});
		}
	})
	}).catch(()=>{
		res.json({"status":"error"});
	})
}
exports.submitJob = (req,res) =>{
	 
	jobModel.create({data : req.body.data} ,(err,job)=>{
		if(err){
			res.json({"status" : "error"});
		}
		else{
			jobQueue.push(job);
			res.status(200).send(job._id);
		}
	})
}

exports.getResult = (req,res) =>{
	jobModel.find({_id : req.body.id},(err,job)=>{
		if(err){
			res.json({"status" : "error"});
		}
		else{
			if(job.status) res.json({"status" : "pending"})
			else res.json({"status" : "completed"});
		}
	})
}
